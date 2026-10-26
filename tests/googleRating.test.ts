import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveGoogleRating } from "../src/lib/googleRating.ts";
import { isVettedListing } from "../src/lib/vetting.ts";

test("resolveGoogleRating only trusts real Google sources", () => {

assert.equal(resolveGoogleRating({}), null);
assert.equal(resolveGoogleRating({ googleRating: null }), null);
assert.equal(resolveGoogleRating({ place: { rating: 4, isFromApi: false } }), null);
assert.equal(resolveGoogleRating({ place: { rating: 4.0 } }), null);
assert.deepEqual(resolveGoogleRating({ googleRating: 4.5 }), { rating: 4.5, reviewCount: undefined });
assert.deepEqual(
  resolveGoogleRating({ google: { rating: 4.8, totalReviews: 12 }, googleRating: 3 }),
  { rating: 4.8, reviewCount: 12 },
);
assert.equal(resolveGoogleRating({ place: { rating: 0, isFromApi: true } }), null);
assert.deepEqual(
  resolveGoogleRating({ place: { rating: 4.2, reviewCount: 9, isFromApi: true } }),
  { rating: 4.2, reviewCount: 9 },
);

assert.equal(isVettedListing(null), false);
assert.equal(isVettedListing({ verificationStatus: "approved", verifiedAt: null }), false);
assert.equal(isVettedListing({ verificationStatus: "pending", verifiedAt: "2026-01-01T00:00:00Z" }), false);
assert.equal(isVettedListing({ verificationStatus: "approved", verifiedAt: "2026-01-01T00:00:00Z" }), true);
});
