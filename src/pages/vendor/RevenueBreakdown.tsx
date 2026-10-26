import { formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { ArrowLeft, DollarSign } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueItem {
  service: string;
  bookings: number;
  amount: number;
}

const RevenueBreakdown = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();

  const { data: revenueData = [], isLoading } = useQuery({
    queryKey: ['vendorRevenueBreakdown', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get vendor profile
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      // Fetch all completed bookings for this vendor
      const { data: bookings } = await supabase
        .from('bookings')
        .select('experience_name, total_amount, vendor_payout_amount')
        .eq('vendor_profile_id', vendorProfile.id)
        .eq('status', 'completed');

      if (!bookings || bookings.length === 0) return [];

      // Aggregate by service/experience
      const revenueByService: Record<string, { bookings: number; amount: number }> = {};
      
      bookings.forEach(booking => {
        const serviceName = booking.experience_name || 'Unknown Service';
        const amount = booking.vendor_payout_amount || booking.total_amount || 0;
        
        if (!revenueByService[serviceName]) {
          revenueByService[serviceName] = { bookings: 0, amount: 0 };
        }
        revenueByService[serviceName].bookings += 1;
        revenueByService[serviceName].amount += amount;
      });

      // Convert to array and sort by amount descending
      return Object.entries(revenueByService)
        .map(([service, data]) => ({
          service,
          bookings: data.bookings,
          amount: data.amount,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="horizon-line" />
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-8 sm:px-8 lg:pt-12 space-y-8">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="font-display text-3xl leading-tight text-foreground lg:text-5xl">Revenue Breakdown</h1>
          <p className="text-sm text-muted-foreground">Detailed revenue by service</p>
        </div>

        <section>
          <p className="text-sm text-muted-foreground">Revenue from completed bookings</p>
          {isLoading ? <Skeleton className="mt-2 h-14 w-48" /> : (
            <p className="mt-1 font-display text-5xl tabular-nums text-foreground lg:text-6xl">{formatMoney(totalRevenue)}</p>
          )}
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </Card>
              ))}
            </>
          ) : revenueData.length === 0 ? (
            <Card className="p-6 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No revenue data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue from completed bookings will appear here
              </p>
            </Card>
          ) : (
            revenueData.map((item, index) => (
              <Card
                key={index}
                className="p-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight">{item.service}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.bookings} booking{item.bookings !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-base font-bold whitespace-nowrap">{formatMoney(item.amount)}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-brand h-2 rounded-full transition-all duration-500"
                      style={{ width: `${totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default RevenueBreakdown;