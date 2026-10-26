import { Card } from "@/components/ui/card";
import { ArrowLeft, Star, ThumbsUp, ExternalLink } from "lucide-react";
import { SubpageShell, AsideBlock } from "@/components/dashboard/Subpage";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";

const VendorRatings = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();

  // Fetch vendor profile with Google rating
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ['vendorRatingsProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, google_rating, google_reviews_url, google_place_id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const placeId = vendorProfile?.google_place_id ?? null;
  const { data: live, isLoading: liveLoading } = useGoogleReviews({
    id: vendorProfile?.id,
    placeId,
    enabled: Boolean(placeId),
  });

  const resolvedRating = resolveGoogleRating({ googleRating: live?.rating ?? vendorProfile?.google_rating });
  const googleRating = resolvedRating?.rating;
  const reviewCount = live?.totalReviews;
  const googleReviewsUrl = live?.googleMapsUrl ?? vendorProfile?.google_reviews_url;
  const loading = isLoading || (Boolean(placeId) && liveLoading);

  const verdict = !googleRating
    ? null
    : googleRating >= 4.5
    ? 'Top of the range. Hosts filter by 4.5 and up, so you show in every storefront.'
    : googleRating >= 4.0
    ? 'Solid. A few more five-star reviews puts you above the 4.5 line hosts filter on.'
    : 'Below what most hosts list. Recent reviews below show what guests mention.';

  return (
    <>
      <SubpageShell
        backLabel="Back to dashboard"
        onBack={goBack}
        eyebrow="Reputation"
        title="Your rating"
        subtitle="What guests and hosts see next to your name. It comes from your Google listing, not from stackd."
        actions={googleReviewsUrl ? (
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap" onClick={() => window.open(googleReviewsUrl, '_blank')}>
            <ExternalLink className="h-4 w-4" />
            Open on Google
          </Button>
        ) : undefined}
        aside={
          <>
            <AsideBlock title="Source">
              {placeId ? (
                <p className="text-muted-foreground">
                  {live ? 'Live from Google Places' : 'Stored rating'} for place ID{' '}
                  <code className="break-all text-xs text-foreground">{placeId}</code>. Refreshed at most once a day.
                </p>
              ) : (
                <p className="text-muted-foreground">No Google listing is linked. Add your Google Place ID in your profile to show a rating.</p>
              )}
            </AsideBlock>
            {verdict && (
              <AsideBlock title="Where you stand">
                <p className="text-muted-foreground">{verdict}</p>
              </AsideBlock>
            )}
          </>
        }
      >
        <section className="border-b border-white/10 py-8">
          {loading ? (
            <Skeleton className="h-16 w-48" />
          ) : googleRating ? (
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <GoogleRating value={resolvedRating} showCount={false} className="font-display text-6xl lg:text-7xl" starClassName="h-8 w-8" />
              {reviewCount != null && (
                <p className="pb-2 text-muted-foreground tabular-nums">{reviewCount.toLocaleString()} Google reviews</p>
              )}
            </div>
          ) : (
            <p className="font-display text-2xl text-muted-foreground">No rating yet</p>
          )}
        </section>

        {live?.reviews && live.reviews.length > 0 && (
          <section className="py-8">
            <h2 className="font-display text-lg text-foreground">Recent reviews</h2>
            <ul className="mt-4 divide-y divide-white/10">
              {live.reviews.map((r, i) => (
                <li key={i} className="grid gap-2 py-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.author_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="tabular-nums">{r.rating}</span>
                      <Star className="mb-0.5 ml-0.5 inline h-3 w-3 fill-rating text-rating" />
                      {' · '}{r.relative_time_description}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/85 line-clamp-4">{r.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </SubpageShell>
      <VendorBottomNav />
    </>
  );
};

export default VendorRatings;
