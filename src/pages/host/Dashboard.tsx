import { VendorGoogleRating } from "@/components/VendorGoogleRating";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import HostBottomNav from "@/components/HostBottomNav";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { HostOnboardingCard, HostVerificationCard } from "@/components/onboarding";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { formatDay, formatMoney } from "@/lib/format";
import {
  DashboardFrame, DashboardHeader, DashboardSection, FigureList, FigureRow, Notice,
} from "@/components/dashboard/DashboardParts";

interface StorefrontVendor {
  id: string;
  name: string;
  category: string;
  commission_percentage: number | null;
  photos: string[] | null;
  google_rating: number | null;
  google_place_id: string | null;
}

const HostDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // One query feeds every number on the page, so "vendors" always means the same list.
  const { data, isLoading } = useQuery({
    queryKey: ["hostDashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: bookings }, { data: links }] = await Promise.all([
        supabase.from("bookings")
          .select("id, experience_name, vendor_name, booking_date, status, host_payout_amount, created_at")
          .eq("host_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("host_vendor_links").select("vendor_profile_id").eq("host_user_id", user.id),
      ]);
      const vendorIds = [...new Set((links ?? []).map((l) => l.vendor_profile_id))];

      const [{ data: storefront }, { data: reviews }] = vendorIds.length
        ? await Promise.all([
            supabase.from("vendor_profiles")
              .select("id, name, category, commission_percentage, photos, google_rating, google_place_id")
              .in("id", vendorIds),
            supabase.from("reviews").select("rating").in("vendor_profile_id", vendorIds),
          ])
        : [{ data: [] as StorefrontVendor[] }, { data: [] as { rating: number }[] }];

      const all = bookings ?? [];
      const completed = all.filter((b) => b.status === "completed");
      const earnings = completed.reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);
      const pending = all
        .filter((b) => b.status !== "completed" && b.status !== "cancelled")
        .reduce((sum, b) => sum + (Number(b.host_payout_amount) || 0), 0);
      const reviewAvg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

      return {
        earnings,
        pending,
        completedCount: completed.length,
        bookingCount: all.length,
        recent: all.slice(0, 6),
        storefront: ((storefront ?? []) as StorefrontVendor[]).sort(
          (a, b) => (b.commission_percentage ?? 0) - (a.commission_percentage ?? 0),
        ),
        reviewAvg,
        reviewCount: reviews?.length ?? 0,
      };
    },
    enabled: !!user,
  });

  // Check if host profile is complete
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['hostProfileComplete', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, city, recommendations, host_verification_status, government_id_url, selfie_url, host_verification_notes, host_trust_score')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Show onboarding if profile is incomplete (no property name set)
    if (profileData !== undefined) {
      const hasPropertyInfo = profileData?.recommendations && 
        typeof profileData.recommendations === 'object' && 
        'property' in (profileData.recommendations as object);
      setShowOnboarding(!hasPropertyInfo && !profileData?.full_name);
    }
  }, [profileData]);

  // Check Stripe Connect status
  const { data: connectStatus, refetch: refetchConnectStatus } = useQuery({
    queryKey: ['hostConnectStatus'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { connected: false, onboardingComplete: false };

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'host' },
      });

      if (error) {
        console.error('Error checking connect status:', error);
        return { connected: false, onboardingComplete: false };
      }
      return data;
    },
    staleTime: 30 * 1000,
  });

  // Handle Stripe Connect return
  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Stripe account connected successfully!');
      refetchConnectStatus();
      window.history.replaceState({}, '', '/host/dashboard');
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Please complete your Stripe account setup');
      window.history.replaceState({}, '', '/host/dashboard');
    }
  }, [searchParams, refetchConnectStatus]);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'host' },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Stripe setup opened in a new tab. Complete the setup there, then refresh this page.');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to start Stripe onboarding');
      setIsConnecting(false);
    }
  };
  
  const payoutsReady = Boolean(connectStatus?.onboardingComplete);
  const firstName = profileData?.full_name?.split(" ")[0];
  const verified = profileData?.host_verification_status === "verified";

  return (
    <>
      <PageTransition>
        <DashboardFrame>
          <DashboardHeader
            eyebrow="Host dashboard"
            title={firstName ? `${firstName}'s storefront` : "Your storefront"}
            subtitle="What your guests booked, what you earned, and who you recommend."
            actions={
              <>
                {profileData && typeof profileData.host_trust_score === "number" && (
                  <TrustScoreBadge score={profileData.host_trust_score} size="sm" />
                )}
                <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => navigate("/host/vendors")}>Manage vendors</Button>
                <Button variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => navigate("/signout")}>Sign out</Button>
              </>
            }
          />

          {!payoutsReady && (
            <Notice
              title="Payouts aren't set up yet"
              body="Connect Stripe so your commission from each booking reaches your bank."
              action={
                <Button onClick={handleConnectStripe} disabled={isConnecting} className="shrink-0">
                  {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isConnecting ? "Opening Stripe" : "Connect Stripe"}
                </Button>
              }
            />
          )}

          {showOnboarding && (
            <div className="mt-6">
              <HostOnboardingCard onComplete={() => { setShowOnboarding(false); refetchProfile(); }} />
            </div>
          )}

          <div className="grid gap-x-14 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div>
              <section className="mt-10 grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Commission earned</p>
                  {isLoading ? <Skeleton className="mt-2 h-14 w-48" /> : (
                    <p className="mt-1 font-display text-5xl tabular-nums text-foreground lg:text-6xl">{formatMoney(data?.earnings)}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    From {data?.completedCount ?? 0} completed booking{data?.completedCount === 1 ? "" : "s"}.{" "}
                    <Link to="/host/earnings" className="text-primary hover:underline">Earnings</Link>
                  </p>
                </div>
                <div className="sm:border-l sm:border-white/10 sm:pl-8">
                  <p className="text-sm text-muted-foreground">Still to pay out</p>
                  {isLoading ? <Skeleton className="mt-2 h-10 w-32" /> : (
                    <p className="mt-1 font-display text-3xl tabular-nums text-foreground/80">{formatMoney(data?.pending)}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">From bookings that haven't happened yet.</p>
                </div>
              </section>

              <DashboardSection title="Recent bookings" action={{ label: "All bookings", to: "/host/bookings" }}>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !data?.recent.length ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                    No bookings yet. Share your storefront link with guests and their bookings land here.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/10 border-y border-white/10">
                    {data.recent.map((b) => (
                      <li key={b.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-3.5 sm:grid-cols-[7rem_1fr_6rem_6rem] sm:items-center">
                        <span className="order-2 col-span-1 text-xs text-muted-foreground sm:order-none sm:text-sm">{formatDay(b.booking_date)}</span>
                        <span className="order-1 min-w-0 sm:order-none">
                          <span className="block truncate font-medium text-foreground">{b.experience_name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{b.vendor_name || "Vendor"}</span>
                        </span>
                        <span className="hidden text-sm capitalize text-muted-foreground sm:block">{b.status}</span>
                        <span className="order-1 row-span-2 self-center text-right tabular-nums text-foreground sm:order-none sm:row-span-1">
                          {formatMoney(b.host_payout_amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </DashboardSection>

              <DashboardSection title="Vendors in your storefront" action={{ label: "Manage", to: "/host/vendors" }}>
                {isLoading ? <Skeleton className="h-40 w-full" /> : !data?.storefront.length ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                    You haven't added any vendors. <Link to="/host/vendors" className="text-primary hover:underline">Browse vendors</Link> to start earning commission.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.storefront.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => navigate(`/vendor/${v.id}`)}
                        className="group flex gap-4 rounded-xl border border-white/10 p-3 text-left transition-colors hover:border-white/25"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {v.photos?.[0] && <img src={v.photos[0]} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground group-hover:text-primary">{v.name}</p>
                          <p className="text-xs text-muted-foreground">{v.category}</p>
                          <VendorGoogleRating vendor={v} className="mt-1 text-sm" starClassName="h-3.5 w-3.5" />
                          {v.commission_percentage != null && (
                            <p className="mt-1 text-sm text-secondary">{v.commission_percentage}% commission</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </DashboardSection>
            </div>

            <aside className="lg:pt-10">
              <DashboardSection title="Key figures" className="lg:mt-0">
                <FigureList>
                  <FigureRow label="Bookings" hint="All statuses" value={data?.bookingCount ?? 0} to="/host/bookings" />
                  <FigureRow label="Vendors in storefront" value={data?.storefront.length ?? 0} to="/host/vendors" />
                  <FigureRow
                    label="Guest reviews"
                    hint={data?.reviewCount ? `${data.reviewCount} on stackd for your vendors` : "None yet"}
                    value={data?.reviewAvg != null ? data.reviewAvg.toFixed(1) : "None"}
                    to="/host/ratings"
                  />
                  <FigureRow label="Payouts" value={<span className="font-sans text-sm">{payoutsReady ? "Active" : "Not connected"}</span>} to="/host/payment-settings" />
                </FigureList>
              </DashboardSection>

              {profileData && !verified && (
                <div className="mt-8">
                  <HostVerificationCard
                    verificationStatus={(profileData.host_verification_status as any) || "unverified"}
                    verificationNotes={profileData.host_verification_notes}
                    existingIdUrl={profileData.government_id_url}
                    existingSelfieUrl={profileData.selfie_url}
                    onStatusChange={() => refetchProfile()}
                  />
                </div>
              )}
              {verified && <p className="mt-6 text-sm text-muted-foreground">Identity verified.</p>}
            </aside>
          </div>
        </DashboardFrame>
      </PageTransition>
      {/* Outside PageTransition: a transformed ancestor would turn position:fixed into position:absolute. */}
      <HostBottomNav />
    </>
  );
};

export default HostDashboard;
