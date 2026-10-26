import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { formatDay, formatMoney } from "@/lib/format";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostEarnings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ['hostEarnings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select('id, experience_name, vendor_name, host_payout_amount, booking_date, guests')
        .eq('host_user_id', user.id)
        .eq('status', 'completed')
        .order('booking_date', { ascending: false });

      return data?.map((b) => ({
        id: b.id,
        service: b.experience_name,
        vendor: b.vendor_name || 'Unknown',
        amount: b.host_payout_amount || 0,
        bookings: b.guests || 1,
        date: new Date(b.booking_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
      })) || [];
    },
    enabled: !!user,
  });

  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalBookings = earnings.length;

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
          <h1 className="font-display text-3xl leading-tight text-foreground lg:text-5xl">Total Earnings</h1>
          <p className="text-sm text-muted-foreground">Detailed earnings breakdown</p>
        </div>

        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
          <section>
            <p className="text-sm text-muted-foreground">Commission earned</p>
            {isLoading ? <Skeleton className="mt-2 h-14 w-48" /> : (
              <p className="mt-1 font-display text-5xl tabular-nums text-foreground lg:text-6xl">{formatMoney(totalEarnings)}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">From {totalBookings} completed booking{totalBookings === 1 ? "" : "s"}.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground">History</h2>
            <div className="mt-4 border-t border-white/10">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="my-3 h-10 w-full" />)
              ) : earnings.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">No commission yet. It shows up here once a guest you referred completes a booking.</p>
              ) : (
                earnings.map((item) => (
                  <div key={item.id} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.service}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.vendor} · {item.bookings} {item.bookings === 1 ? "guest" : "guests"} · {formatDay(item.date)}</p>
                    </div>
                    <p className="text-sm tabular-nums text-foreground">{formatMoney(item.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostEarnings;
