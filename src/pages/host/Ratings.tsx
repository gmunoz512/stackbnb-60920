import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star } from "lucide-react";
import { DashboardFrame, DashboardHeader, DashboardSection } from "@/components/dashboard/DashboardParts";
import { formatDay } from "@/lib/format";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostRatings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['hostVendorReviews', user?.id],
    queryFn: async () => {
      if (!user) return { reviews: [], vendorNames: {} };

      // Get linked vendor IDs
      const { data: links } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      if (!links || links.length === 0) return { reviews: [], vendorNames: {} };

      const vendorIds = links.map(l => l.vendor_profile_id);

      // Fetch vendor names
      const { data: vendors } = await supabase
        .from('vendor_profiles')
        .select('id, name')
        .in('id', vendorIds);

      const vendorNames: Record<string, string> = {};
      vendors?.forEach(v => {
        vendorNames[v.id] = v.name;
      });

      // Fetch reviews for these vendors
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, vendor_profile_id, booking_id')
        .in('vendor_profile_id', vendorIds)
        .order('created_at', { ascending: false });

      return { reviews: reviews || [], vendorNames };
    },
    enabled: !!user,
  });

  const reviews = reviewsData?.reviews || [];
  const vendorNames = reviewsData?.vendorNames || {};

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fiveStarPercentage = reviews.length > 0 
    ? Math.round((fiveStarCount / reviews.length) * 100)
    : 0;

  return (
    <>
      <DashboardFrame>
        <button onClick={goBack} className="mt-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </button>
        <DashboardHeader
          eyebrow="Guest reviews"
          title="What guests say about your vendors"
          subtitle="Reviews left on stackd after a booking. Google ratings are shown on each vendor's page."
        />

        <div className="grid gap-x-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
          <aside>
            <section className="mt-10">
              <p className="text-sm text-muted-foreground">Average from {reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
              {isLoading ? <Skeleton className="mt-2 h-14 w-28" /> : (
                <p className="mt-1 font-display text-6xl tabular-nums text-foreground">
                  {reviews.length ? avgRating : "None"}
                  {reviews.length > 0 && <span className="ml-2 text-xl text-muted-foreground">/ 5</span>}
                </p>
              )}
              {reviews.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{fiveStarPercentage}% gave five stars.</p>}
            </section>

            {!isLoading && reviews.length > 0 && (
              <DashboardSection title="Breakdown">
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => Math.floor(r.rating) === stars).length;
                    const pct = (count / reviews.length) * 100;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-sm">
                        <span className="w-14 text-muted-foreground">{stars} star{stars === 1 ? "" : "s"}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right tabular-nums text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </DashboardSection>
            )}
          </aside>

          <DashboardSection title="Latest reviews" className="lg:mt-10">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-sm text-muted-foreground">
                No reviews yet. When guests review a vendor from your storefront, it shows up here.
              </p>
            ) : (
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {reviews.map((review) => (
                  <li key={review.id} className="py-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-medium text-foreground">{vendorNames[review.vendor_profile_id || ""] || "Vendor"}</p>
                      <span className="flex items-center gap-1 text-sm tabular-nums text-foreground">
                        <Star className="h-3.5 w-3.5 fill-rating text-rating" />
                        {review.rating}
                      </span>
                    </div>
                    {review.comment && <p className="mt-2 max-w-2xl text-foreground/85">{review.comment}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDay(review.created_at?.slice(0, 10))}</p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>
      </DashboardFrame>
      <HostBottomNav />
    </>
  );
};

export default HostRatings;
