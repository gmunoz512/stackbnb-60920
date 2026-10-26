import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubpageShell, FormSection, AsideBlock } from "@/components/dashboard/Subpage";
import VendorBottomNav from "@/components/VendorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CANCELLATION_OPTIONS = [
  { value: "6", label: "6 hours before" },
  { value: "12", label: "12 hours before" },
  { value: "24", label: "24 hours before" },
  { value: "48", label: "48 hours before (2 days)" },
  { value: "72", label: "72 hours before (3 days)" },
  { value: "168", label: "168 hours before (7 days)" },
];

const VendorSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellationHours, setCancellationHours] = useState("24");
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchVendorSettings();
    }
  }, [user]);

  const fetchVendorSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, cancellation_hours')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setVendorProfileId(data.id);
        setCancellationHours(data.cancellation_hours?.toString() || "24");
      }
    } catch (error) {
      console.error('Error fetching vendor settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vendorProfileId) {
      toast({
        title: "Error",
        description: "No vendor profile found. Please create a profile first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ cancellation_hours: parseInt(cancellationHours) })
        .eq('id', vendorProfileId);
      
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Your cancellation policy has been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <SubpageShell
        backLabel="Back"
        onBack={() => navigate(-1)}
        eyebrow="Business settings"
        title="Settings"
        subtitle="Policies that apply to every booking of your services."
        aside={
          <>
            <AsideBlock title="Where this shows">
              <p className="text-muted-foreground">The cancellation window is shown on every service page and in the booking confirmation email guests receive.</p>
            </AsideBlock>
            <AsideBlock title="Common choices">
              <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
                <li>24 hours for tours and classes</li>
                <li>48 to 72 hours for private charters and chefs</li>
              </ul>
            </AsideBlock>
          </>
        }
      >
        <FormSection title="Cancellation policy" description="How far ahead guests must cancel to get a refund.">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cancellation-hours">Cancellation window</Label>
                  <Select
                    value={cancellationHours}
                    onValueChange={setCancellationHours}
                  >
                    <SelectTrigger id="cancellation-hours">
                      <SelectValue placeholder="Select cancellation window" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCELLATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>
                    Guests will be able to cancel their booking up to{" "}
                    <span className="font-medium text-foreground">
                      {cancellationHours} hours
                    </span>{" "}
                    before the scheduled time. Cancellations made after this window will not be eligible for a refund.
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !vendorProfileId}
                  className="sm:w-auto"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </>
            )}
        </FormSection>
      </SubpageShell>
      <VendorBottomNav />
    </>
  );
};

export default VendorSettings;
