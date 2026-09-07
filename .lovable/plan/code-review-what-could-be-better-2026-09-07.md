# Code Review: What Could Be Better

A pass over the app's structure, performance, consistency and accessibility. Security was already covered in earlier rounds, so this focuses on code health and user-visible quality.

---

## Findings

### 1. Everything loads at once (performance)
`src/App.tsx` imports all ~70 pages eagerly — admin panels, vendor onboarding, the trip planner, the maps page — so a first-time visitor downloads the entire app before seeing the splash screen. Nothing uses `React.lazy`.

**Fix:** Lazy-load route pages with `React.lazy` + a `Suspense` fallback, keeping only the splash/landing eager. This is the single biggest speed win available.

### 2. The same Google-reviews caching logic is copy-pasted in 8 places
`google_reviews_*` localStorage read/write/expiry code is duplicated across `AppView`, `RestaurantDetail`, `RestaurantCard`, `RestaurantCardWithGoogleRating`, `vendor/Ratings`, `vendor/PublicProfile`, `vendor/ProfilePreview`, `vendor/CreateProfile` — each with slightly different cache keys, so the same restaurant can show two different ratings on two screens.

**Fix:** One `useGoogleReviews(placeOrQuery)` hook backed by React Query with a shared cache key, replacing all eight copies.

### 3. Data fetching is split between two styles
21 files use React Query; 34 page files still hand-roll `useEffect` + `useState` + manual loading/error flags. The hand-rolled ones refetch on every mount, have no shared cache, and each invents its own error message.

**Fix:** Migrate the highest-traffic pages (Explore, AppView, vendor PublicProfile, host/vendor Dashboards) to React Query so they share caching and consistent loading states.

### 4. Very large page files
`vendor/CreateProfile.tsx` (1350 lines), `guest/AppView.tsx` (1063), `VendorLocationMap.tsx` (909), `ItineraryContext.tsx` (879). These mix data fetching, form state and layout, which makes any change risky.

**Fix:** Split each into a few focused pieces (form steps, list sections, map layers) without changing behaviour.

### 5. Hardcoded colours bypass the theme
About 130 uses of `text-white`, `bg-black`, `bg-[#...]` across the app — worst in `AppView` (22), `Explore` (20), `ProfilePreview`, `VendorApprovals`, `HostVerifications` (10 each). These break dark mode and make rebranding a find-and-replace job.

**Fix:** Move them onto the existing design tokens in `index.css`.

### 6. Social/preview image points at an old domain
`index.html` sets `og:image` and `twitter:image` to `stackbnb-60920.lovable.app`, not the live `stackd.lovable.app`, and the page title is just "Stackd" with no keywords.

**Fix:** Remove the stale absolute image URLs (hosting supplies the preview image) and write a descriptive title.

### 7. Accessibility gaps
Four `<img>` tags have no `alt` text (`RestaurantDetail`, `host/Vendors`, `auth/Auth` ×2), and many of the 152 icon-only `<button>`s have no accessible label, so screen readers announce them as "button".

**Fix:** Add `alt` text and `aria-label` to icon-only controls.

### 8. Signed-out handling is inconsistent
`MyBookings` shows a friendly "sign in to continue" screen; `Profile` silently redirects to `/auth`. Neither is wrapped in `ProtectedRoute`, unlike the chat and refund routes.

**Fix:** Pick one behaviour (the friendly prompt) and apply it consistently to account pages.

---

## Suggested order

**Batch 1 — highest impact, low risk**
1. Lazy-load routes (#1)
2. Fix the social preview image and title (#6)
3. Add missing `alt` text and button labels (#7)
4. Make signed-out screens consistent (#8)

**Batch 2 — consistency**
5. Single Google-reviews hook replacing the 8 copies (#2)
6. Replace hardcoded colours with theme tokens (#5)

**Batch 3 — structure**
7. Migrate key pages to React Query (#3)
8. Split the four oversized files (#4)

---

## Technical notes

- Lazy loading: `const Explore = lazy(() => import("./pages/guest/Explore"))` with a single `<Suspense>` boundary inside the existing `ErrorBoundary`; the barrel files in `src/pages/*/index.ts` need default exports preserved.
- The reviews hook lives in `src/hooks/useGoogleReviews.ts`, calls the existing `google-reviews` edge function, and uses React Query's cache (24h `staleTime`) instead of manual localStorage timestamps.
- No database or edge-function changes in any batch.
