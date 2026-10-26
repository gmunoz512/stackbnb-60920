import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubpageShell, FormSection, AsideBlock } from "@/components/dashboard/Subpage";
import { formatMoney } from "@/lib/format";
import HostBottomNav from "@/components/HostBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { vendorSchema, type VendorFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useSmartBack } from "@/hooks/use-smart-back";

const AddVendor = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/host/vendors");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendorName: "",
      vendorEmail: "",
      category: "",
      commission: "",
      recommendation: "",
    },
  });

  const handleSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in with a Supabase account", {
          description: "Visit /auth/host to create an account"
        });
        navigate('/auth/host');
        return;
      }

      const { error } = await supabase.from('vendors').insert({
        user_id: user.id,
        name: data.vendorName.trim(),
        email: data.vendorEmail.trim(),
        category: data.category,
        commission: parseFloat(data.commission),
        description: data.recommendation.trim(),
      });

      if (error) {
        throw error;
      }

      toast.success("Vendor added successfully!");
      navigate('/host/vendors');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again";
      toast.error("Failed to add vendor", {
        description: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commission = Number(form.watch("commission")) || 0;
  const examplePrice = 100;

  return (
    <>
      <SubpageShell
        backLabel="Back to vendors"
        onBack={goBack}
        eyebrow="Vendors"
        title="Invite a vendor"
        subtitle="They get an email to accept your commission and set up their services. Nothing shows to guests until they accept."
        aside={
          <>
            <AsideBlock title="On a $100 booking">
              <dl className="space-y-2 tabular-nums">
                <div className="flex justify-between"><dt className="text-muted-foreground">Guest pays</dt><dd>{formatMoney(examplePrice)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">You earn</dt><dd>{formatMoney(examplePrice * commission / 100)}</dd></div>
                <div className="flex justify-between border-t border-white/10 pt-2"><dt className="text-muted-foreground">Vendor keeps</dt><dd>{formatMoney(examplePrice * (100 - commission) / 100)}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Before payment processing fees.</p>
            </AsideBlock>
            <AsideBlock title="What happens next">
              <ol className="list-decimal space-y-1.5 pl-4 text-muted-foreground">
                <li>The vendor gets your invite by email.</li>
                <li>They accept or counter the commission.</li>
                <li>Their services appear in your guest guide.</li>
              </ol>
            </AsideBlock>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormSection title="Who they are" description="The business and the address the invite goes to.">
              <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ocean Adventures" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Vendor Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@oceanadventures.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="water-sports">Water Sports</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="food-dining">Food & Dining</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="photography">Photography</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="tours">Tours & Activities</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            <FormSection title="Commission" description="Your share of each booking. Typical range is 15 to 25%.">
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Proposed Commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Vendor must accept this rate. Typical range: 15–25%.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            <FormSection title="Your recommendation" description="Shown to guests next to this vendor in your guide.">
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Why recommend them?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your guests why you recommend this vendor..."
                        rows={4}
                        className="rounded-xl resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormSection>
            <div className="flex justify-end gap-3 py-8">
              <Button type="button" variant="ghost" onClick={goBack}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : "Send invitation"}</Button>
            </div>
          </form>
        </Form>
      </SubpageShell>
      <HostBottomNav />
    </>
  );
};

export default AddVendor;
