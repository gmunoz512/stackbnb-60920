import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { resolveGoogleRating, type ResolvedGoogleRating } from "@/lib/googleRating";

export interface RatedVendor {
  google_rating?: number | null;
  google_place_id?: string | null;
}

/**
 * Experiences store their Google listing as google_place_id; google_rating is rarely filled in.
 * Use the stored number when there is one, otherwise read the live Google Places rating
 * (same cached query the detail page uses, so cards and detail pages always agree).
 */
export function useVendorRating(vendor: RatedVendor | null | undefined): ResolvedGoogleRating | null {
  const placeId = vendor?.google_place_id ?? null;
  const { data } = useGoogleReviews({ placeId, enabled: Boolean(placeId) });
  return resolveGoogleRating({
    google: data ? { rating: data.rating, totalReviews: data.totalReviews } : null,
    googleRating: vendor?.google_rating ?? null,
  });
}
