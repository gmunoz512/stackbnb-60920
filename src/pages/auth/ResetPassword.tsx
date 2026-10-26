import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthSidePanel, AuthMobileMark } from "@/components/auth/AuthSidePanel";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isChecking, setIsChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // If the auth system uses a `code` param (PKCE), exchange it for a session.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setHasRecoverySession(false);
            return;
          }
          // Remove the code from the URL to prevent re-processing on refresh.
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        }

        const { data } = await supabase.auth.getSession();
        setHasRecoverySession(Boolean(data.session));
      } finally {
        setIsChecking(false);
      }
    };

    bootstrap();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 8) {
      toast({
        title: "Password too short",
        description: "Please use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm the same password.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });

      navigate("/auth", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update password";
      toast({
        title: "Couldn't update password",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <AuthSidePanel />
      <main className="flex min-h-screen items-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-6">
          <AuthMobileMark />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">Password reset</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground lg:text-4xl">This reset link has expired</h1>
            <p className="mt-3 text-sm text-muted-foreground">Request a new password reset email from the sign-in page.</p>
          </div>
          <Button asChild className="w-full"><Link to="/auth">Back to sign in</Link></Button>
        </div>
      </main>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <AuthSidePanel />
      <main className="flex min-h-screen items-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-6">
          <AuthMobileMark />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">Password reset</p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-foreground lg:text-4xl">Set a new password</h1>
            <p className="mt-3 text-sm text-muted-foreground">Choose a strong password you haven't used elsewhere.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
