import { GoogleRating } from "@/components/GoogleRating";
import { useRestaurantRating } from "@/hooks/useRestaurantRating";
import type { Restaurant } from "@/data/mockRestaurants";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof GoogleRating>, "value"> & { restaurant: Restaurant };

export function RestaurantGoogleRating({ restaurant, ...rest }: Props) {
  const { rating } = useRestaurantRating(restaurant);
  return <GoogleRating value={rating} {...rest} />;
}
export default RestaurantGoogleRating;
