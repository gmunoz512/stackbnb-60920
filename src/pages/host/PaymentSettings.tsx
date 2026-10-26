import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { SubpageShell, FormSection, AsideBlock } from "@/components/dashboard/Subpage";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const PaymentSettings = () => {
  const goBack = useSmartBack("/host/profile");
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);
  const [connectStatus, setConnectStatus] = useState<{
    connected: boolean;
    onboardingComplete: boolean;
    accountId?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkConnectStatus();
    }
  }, [user]);

  const checkConnectStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      setConnectStatus(data);
    } catch (error) {
      console.error('Error checking connect status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Stripe Setup",
          description: "Complete your setup in the new tab, then refresh this page.",
        });
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to start Stripe setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsOpeningDashboard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-login-link', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening Stripe dashboard:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to open payment dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningDashboard(false);
    }
  };

  const status = connectStatus?.onboardingComplete
    ? { label: "Payouts on", tone: "text-success-strong", text: "Your bank account is connected and ready to receive commissions from vendor bookings." }
    : connectStatus?.connected
    ? { label: "Setup incomplete", tone: "text-rating-strong", text: "You've started with Stripe but a few steps are left before money can reach you." }
    : { label: "Not connected", tone: "text-muted-foreground", text: "Connect a bank account to start receiving commissions from vendor bookings." };

  return (
    <>
      <SubpageShell
        backLabel="Back"
        onBack={goBack}
        eyebrow="Payouts"
        title="Payment settings"
        subtitle="Money moves through Stripe. stackd never stores your bank details."
        actions={
          <Button variant="ghost" size="sm" onClick={checkConnectStatus} className="whitespace-nowrap text-muted-foreground">
            Refresh status
          </Button>
        }
        aside={
          <>
            <AsideBlock title={connectStatus?.onboardingComplete ? "Manage in Stripe" : "What you'll need"}>
              {connectStatus?.onboardingComplete ? (
                <p className="text-muted-foreground">Balance, bank details and payout schedule live in your Stripe Express dashboard.</p>
              ) : (
                <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
                  <li>Bank account or debit card details</li>
                  <li>ID for Stripe's verification</li>
                  <li>About 5 minutes</li>
                </ul>
              )}
            </AsideBlock>
          </>
        }
      >
        <FormSection title="Status" description={isLoading ? undefined : status.text}>
          {isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <>
              <p className={`font-display text-3xl ${status.tone}`}>{status.label}</p>
              {connectStatus?.onboardingComplete ? (
                <Button onClick={handleOpenDashboard} disabled={isOpeningDashboard} variant="outline" className="gap-2">
                  {isOpeningDashboard ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {isOpeningDashboard ? "Opening..." : "Open Stripe dashboard"}
                </Button>
              ) : (
                <Button onClick={handleConnectStripe} disabled={isConnecting} className="gap-2">
                  {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {isConnecting ? "Opening Stripe..." : connectStatus?.connected ? "Continue setup" : "Connect bank account"}
                </Button>
              )}
            </>
          )}
        </FormSection>
        <FormSection title="How payouts work">
          <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
            <li>When guests book through your guide, your commission is held until the experience is completed.</li>
            <li>Stripe deposits to your bank on its schedule, usually daily.</li>
            <li>Cancelled bookings are refunded to the guest and never paid out.</li>
          </ol>
        </FormSection>
      </SubpageShell>
      <HostBottomNav />
    </>
  );
};

export default PaymentSettings;
