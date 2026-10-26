import { formatDay, formatMoney } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostBookings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['hostAllBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_user_id', user.id)
        .order('booking_date', { ascending: false });

      return data || [];
    },
    enabled: !!user,
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.host_payout_amount || 0), 0);

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
          <h1 className="font-display text-3xl leading-tight text-foreground lg:text-5xl">All Bookings</h1>
          <p className="text-sm text-muted-foreground">Complete booking history</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{bookings.length}</p>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              )}
            </div>
          </Card>
        </div>

        {/* All Bookings List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Booking History</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your bookings will appear here once guests book through your referrals
              </p>
            </Card>
          ) : (
            <div className="border-t border-white/10">
              {bookings.map((booking) => (
                <div key={booking.id} className="grid gap-1 border-b border-white/10 py-4 text-sm md:grid-cols-[1fr_1.6fr_1.2fr_0.8fr_0.8fr] md:items-center md:gap-4">
                  <span className="text-muted-foreground">{formatDay(booking.booking_date)}</span>
                  <span className="font-medium text-foreground">{booking.experience_name}</span>
                  <span className="text-muted-foreground">{booking.vendor_name || "Vendor not set"}</span>
                  <span className="capitalize text-muted-foreground">{booking.status}</span>
                  <span className="tabular-nums text-foreground md:text-right">{formatMoney(booking.host_payout_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostBookings;
