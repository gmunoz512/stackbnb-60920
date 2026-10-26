import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorOnboardingWizard } from "@/components/onboarding";
import HostVerificationCard from "@/components/onboarding/HostVerificationCard";
import { VendorGoogleRating } from "@/components/VendorGoogleRating";
import { formatDay, formatMoney, formatTime } from "@/lib/format";
import {
  DashboardFrame, DashboardHeader, DashboardSection, FigureList, FigureRow, Notice,
} from "@/components/dashboard/DashboardParts";

interface UpcomingBooking {
  id: string;
  service: string;
  date: string;
  time: string | null;
  guests: number;
  host: string;
}

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const { user } = useAuthContext();

  // Everything on this page comes from one query so the numbers can't disagree.
  const { data, isLoading } = useQuery({
    queryKey: ["vendorDashboard", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: vendor } = await supabase
        .from("vendor_profiles")
        .select("id, name, google_rating, google_place_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!vendor) return null;

      const today = new Date().toISOString().split("T")[0];
      const [{ data: completed }, { data: upcoming }, { data: links }] = await Promise.all([
        supabase.from("bookings").select("total_amount, vendor_payout_amount, host_user_id")
          .eq("vendor_profile_id", vendor.id).eq("status", "completed"),
        supabase.from("bookings").select("id, experience_name, booking_date, booking_time, guests, host_user_id")
          .eq("vendor_profile_id", vendor.id).gte("booking_date", today)
          .order("booking_date", { ascending: true }).limit(8),
        supabase.from("host_vendor_links").select("host_user_id").eq("vendor_profile_id", vendor.id),
      ]);

      const earnings = (completed ?? []).reduce((sum, b) => sum + (Number(b.vendor_payout_amount ?? b.total_amount) || 0), 0);

      // Active hosts = hosts who list you in their storefront, plus any host who sent you a booking.
      const hostIds = new Set<string>();
      (links ?? []).forEach((l) => l.host_user_id && hostIds.add(l.host_user_id));
      [...(completed ?? []), ...(upcoming ?? [])].forEach((b) => b.host_user_id && hostIds.add(b.host_user_id));

      const bookingHostIds = [...new Set((upcoming ?? []).map((b) => b.host_user_id).filter(Boolean) as string[])];
      const names = new Map<string, string>();
      if (bookingHostIds.length) {
        const { data: hosts } = await supabase.from("profiles").select("user_id, full_name").in("user_id", bookingHostIds);
        (hosts ?? []).forEach((h) => h.full_name && names.set(h.user_id, h.full_name));
      }

      const bookings: UpcomingBooking[] = (upcoming ?? []).map((b) => ({
        id: b.id,
        service: b.experience_name,
        date: b.booking_date,
        time: formatTime(b.booking_time),
        guests: b.guests,
        host: b.host_user_id ? names.get(b.host_user_id) ?? "Host referral" : "Direct booking",
      }));

      return { vendor, earnings, completedCount: completed?.length ?? 0, activeHosts: hostIds.size, bookings };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // Check Stripe Connect status
  const { data: connectStatus, refetch: refetchConnectStatus } = useQuery({
    queryKey: ['vendorConnectStatus'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { connected: false, onboardingComplete: false };

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'vendor' },
      });

      if (error) {
        console.error('Error checking connect status:', error);
        return { connected: false, onboardingComplete: false };
      }
      return data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch identity verification status
  const { data: profileStatus, refetch: refetchProfile } = useQuery({
    queryKey: ['vendorProfileStatus', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('host_verification_status, host_verification_notes, government_id_url, selfie_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Handle Stripe Connect return
  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Stripe account connected successfully!');
      refetchConnectStatus();
      window.history.replaceState({}, '', '/vendor/dashboard');
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Please complete your Stripe account setup');
      window.history.replaceState({}, '', '/vendor/dashboard');
    }
  }, [searchParams, refetchConnectStatus]);

  // Check if vendor profile exists, if not show onboarding wizard
  useEffect(() => {
    const checkVendorProfile = async () => {
      if (!user) return;
      
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Show wizard if no vendor profile exists
      if (!vendorProfile) {
        // Check if they've previously dismissed
        const dismissed = sessionStorage.getItem('vendorOnboardingDismissed');
        if (!dismissed) {
          setShowOnboardingWizard(true);
        }
      }
    };
    
    checkVendorProfile();
  }, [user]);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'vendor' },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to start Stripe onboarding');
      setIsConnecting(false);
    }
  };
  
  const payoutsReady = Boolean(connectStatus?.onboardingComplete);

  return (
    <>
      <VendorOnboardingWizard
        open={showOnboardingWizard}
        onOpenChange={(open) => {
          setShowOnboardingWizard(open);
          if (!open) sessionStorage.setItem("vendorOnboardingDismissed", "true");
        }}
      />
      <PageTransition>
        <DashboardFrame>
          <DashboardHeader
            eyebrow="Vendor dashboard"
            title={data?.vendor?.name || "Your business"}
            subtitle="Earnings, bookings and the hosts sending you guests."
            actions={
              <>
                <Button variant="outline" onClick={() => navigate("/vendor/preview")}>Preview profile</Button>
                <Button variant="ghost" onClick={() => navigate("/signout")}>Sign out</Button>
              </>
            }
          />

          {!payoutsReady && (
            <Notice
              title="Payouts aren't set up yet"
              body="Connect a bank account through Stripe so completed bookings pay out to you."
              action={
                <Button onClick={handleConnectStripe} disabled={isConnecting} className="shrink-0">
                  {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isConnecting ? "Opening Stripe" : "Connect Stripe"}
                </Button>
              }
            />
          )}

          {profileStatus && profileStatus.host_verification_status !== "verified" && (
            <div className="mt-6">
              <HostVerificationCard
                verificationStatus={profileStatus.host_verification_status as any}
                verificationNotes={profileStatus.host_verification_notes}
                existingIdUrl={profileStatus.government_id_url}
                existingSelfieUrl={profileStatus.selfie_url}
                onStatusChange={() => refetchProfile()}
              />
            </div>
          )}

          <div className="grid gap-x-14 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <div>
              <section className="mt-10">
                <p className="text-sm text-muted-foreground">Paid out to you</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-14 w-56" />
                ) : (
                  <p className="mt-1 font-display text-5xl tabular-nums text-foreground lg:text-6xl">{formatMoney(data?.earnings)}</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  From {data?.completedCount ?? 0} completed booking{data?.completedCount === 1 ? "" : "s"}.{" "}
                  <button onClick={() => navigate("/vendor/revenue")} className="text-primary hover:underline">See revenue</button>
                </p>
              </section>

              <DashboardSection title="Upcoming bookings" action={{ label: "All bookings", to: "/vendor/bookings" }}>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : !data?.bookings.length ? (
                  <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                    No upcoming bookings. When a guest books through a host's storefront it shows up here.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead className="hidden bg-white/[0.03] text-left text-xs uppercase tracking-wider text-muted-foreground sm:table-header-group">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Time</th>
                          <th className="px-4 py-3 font-medium">Experience</th>
                          <th className="px-4 py-3 font-medium">Guests</th>
                          <th className="px-4 py-3 font-medium">Host</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {data.bookings.map((b) => (
                          <tr key={b.id} className="block px-4 py-3 sm:table-row sm:p-0">
                            <td className="block text-xs text-muted-foreground sm:table-cell sm:px-4 sm:py-3 sm:text-sm sm:text-foreground">
                              {formatDay(b.date)}<span className="sm:hidden">, {b.time ?? "time not set"}</span>
                            </td>
                            <td className="hidden tabular-nums sm:table-cell sm:px-4 sm:py-3">
                              {b.time ?? <span className="text-muted-foreground">Not set</span>}
                            </td>
                            <td className="block font-medium text-foreground sm:table-cell sm:px-4 sm:py-3">{b.service}</td>
                            <td className="inline text-muted-foreground sm:table-cell sm:px-4 sm:py-3">
                              {b.guests} guest{b.guests === 1 ? "" : "s"}<span className="sm:hidden">, </span>
                            </td>
                            <td className="inline text-muted-foreground sm:table-cell sm:px-4 sm:py-3">{b.host}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardSection>
            </div>

            <aside className="lg:pt-10">
              <DashboardSection title="Key figures" className="lg:mt-0">
                <FigureList>
                  <FigureRow label="Completed bookings" value={data?.completedCount ?? 0} to="/vendor/bookings" />
                  <FigureRow label="Active hosts" hint="List you or have sent you guests" value={data?.activeHosts ?? 0} to="/vendor/hosts" />
                  <FigureRow
                    label="Google rating"
                    hint="Live from your Google listing"
                    to="/vendor/ratings"
                    value={data?.vendor ? <VendorGoogleRating vendor={data.vendor} className="justify-end text-xl" starClassName="h-4 w-4" emptyLabel="No rating yet" /> : "None"}
                  />
                  <FigureRow label="Payouts" value={<span className="font-sans text-sm">{payoutsReady ? "Active" : "Not connected"}</span>} />
                </FigureList>
              </DashboardSection>
            </aside>
          </div>
        </DashboardFrame>
      </PageTransition>
      {/* Outside PageTransition: a transformed ancestor would turn position:fixed into position:absolute. */}
      <VendorBottomNav />
    </>
  );
};

export default VendorDashboard;
