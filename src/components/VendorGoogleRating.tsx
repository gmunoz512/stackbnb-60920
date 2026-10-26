import { GoogleRating } from "@/components/GoogleRating";
import { useVendorRating, type RatedVendor } from "@/hooks/useVendorRating";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof GoogleRating>, "value"> & { vendor: RatedVendor };

/** Google rating for an experience/vendor card: live from its Google place, stored rating as fallback. */
export function VendorGoogleRating({ vendor, ...rest }: Props) {
  const value = useVendorRating(vendor);
  return <GoogleRating value={value} {...rest} />;
}

export default VendorGoogleRating;
