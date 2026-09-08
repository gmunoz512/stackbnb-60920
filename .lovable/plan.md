# Production Security Cleanup: Remove `generate-reset-link`

## Goal
Remove only the obsolete `generate-reset-link` Edge Function from production, leaving all other functions, tables, RLS, auth, and frontend code untouched.

## Verification Results

| # | Check | Result |
|---|-------|--------|
| 1 | No app code references `generate-reset-link` | **FAILED** |
| 2 | `send-reset-otp` / `verify-reset-otp` exist and are the current reset mechanism | Confirmed |
| 3 | Deleting `generate-reset-link` will not affect the OTP functions | Confirmed |

## Details

- `src/pages/host/Auth.tsx:94` still invokes `supabase.functions.invoke('generate-reset-link', …)` in the Host Forgot Password flow.
- `supabase/config.toml:39` still declares `[functions.generate-reset-link]`, which is expected while the function exists.
- `send-reset-otp` and `verify-reset-otp` both exist under `supabase/functions/` and are used by `src/pages/auth/SignIn.tsx` + `src/components/PasswordResetOTPDialog.tsx`.
- Deleting `generate-reset-link` via the backend tools would target only that function name and would not touch `send-reset-otp` or `verify-reset-otp`.

## Decision

Because condition 1 is not satisfied, **do not remove `generate-reset-link`**. Removing it now would break the Host Forgot Password flow in the current deployed frontend.

## Recommended Next Step

Update `src/pages/host/Auth.tsx` to use the OTP flow (`send-reset-otp` / `verify-reset-otp`) instead of `generate-reset-link`. Once that frontend change is merged and deployed, re-run this cleanup.

## No Changes Made

No backend, frontend, database, RLS, auth, secret, or Edge Function changes were made.