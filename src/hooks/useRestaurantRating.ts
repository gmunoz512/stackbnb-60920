import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { resolveGoogleRating, type ResolvedGoogleRating } from "@/lib/googleRating";
import type { Restaurant } from "@/data/mockRestaurants";

/**
 * The one place restaurant ratings come from: live Google Places data (shared react-query
 * cache keyed by restaurant id, so every page shows the same number), with a rating that was
 * itself fetched from Google (isFromApi) as the only fallback.
 */
export function useRestaurantRating(restaurant: Restaurant | null | undefined): {
  rating: ResolvedGoogleRating | null;
  photo?: string;
} {
  const { data } = useGoogleReviews({
    id: restaurant?.id,
    searchQuery: restaurant ? `${restaurant.name} restaurant ${restaurant.address || ""} ${restaurant.city}` : undefined,
    lat: restaurant?.coordinates?.lat,
    lng: restaurant?.coordinates?.lng,
    enabled: Boolean(restaurant),
  });
  const rating = resolveGoogleRating({
    google: data ? { rating: data.rating, totalReviews: data.totalReviews } : null,
    place: restaurant?.isFromApi ? { rating: restaurant.rating, reviewCount: restaurant.reviewCount } : null,
  });
  return { rating, photo: data?.photos?.[0] };
}
