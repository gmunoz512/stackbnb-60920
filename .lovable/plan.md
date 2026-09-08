# Frontend fix: replace obsolete `generate-reset-link` with OTP flow

## Goal
Remove the application's last frontend use of the obsolete `generate-reset-link` Edge Function from the host forgot-password flow, and stop configuring that function in `supabase/config.toml`.

## Files to change
1. `src/pages/host/Auth.tsx`
2. `supabase/config.toml`

## Changes

### `src/pages/host/Auth.tsx`
- Add state for the OTP dialog:
  - `const [showOTPDialog, setShowOTPDialog] = useState(false);`
  - `const [resetEmail, setResetEmail] = useState("");`
- Add import: `import { PasswordResetOTPDialog } from "@/components/PasswordResetOTPDialog";`
- Replace the body of `handleForgotPassword`:
  - Validate `email.trim()` is present (same toast behavior).
  - `setResetEmail(email.trim());`
  - `setShowOTPDialog(true);`
  - Remove the `supabase.functions.invoke('generate-reset-link', ...)` call and the `window.open` / link-handling logic.
- Render `<PasswordResetOTPDialog open={showOTPDialog} onOpenChange={setShowOTPDialog} email={resetEmail} />` in the JSX, matching `src/pages/auth/SignIn.tsx`.

### `supabase/config.toml`
- Remove the block:
  ```toml
  [functions.generate-reset-link]
  verify_jwt = false
  ```

## Not in scope
- Do not modify `send-reset-otp`, `verify-reset-otp`, or `PasswordResetOTPDialog`.
- Do not delete or modify the deployed `generate-reset-link` Edge Function.
- No database, RLS, auth, or secret changes.
- No unrelated code changes.

## Verification
- Run type/build checks.
- Confirm `rg "generate-reset-link"` returns only `supabase/config.toml` if any reference remains, or none after config removal.
- Confirm `send-reset-otp` and `verify-reset-otp` files are untouched.
- Confirm the deployed `generate-reset-link` function was not deleted or modified.
