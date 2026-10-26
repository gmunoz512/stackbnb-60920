import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { SkeletonCardList } from "@/components/ui/skeleton-card";
import { toast } from "sonner";
import { formatDay, formatMoney, formatTime } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const AllBookings = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['vendorAllBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get vendor profile
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      // Fetch all bookings for this vendor
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_profile_id', vendorProfile.id)
        .order('booking_date', { ascending: false });

      const hostIds = [...new Set((bookingsData ?? []).map(b => b.host_user_id).filter(Boolean))] as string[];
      const { data: hostProfiles } = hostIds.length
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', hostIds)
        : { data: [] as { user_id: string; full_name: string | null }[] };
      const hostName = new Map((hostProfiles ?? []).map(h => [h.user_id, h.full_name]));

      return bookingsData?.map(b => ({
        id: b.id,
        service: b.experience_name,
        date: b.booking_date,
        time: b.booking_time,
        guests: b.guests,
        status: b.status,
        amount: b.total_amount,
        host: b.host_user_id ? (hostName.get(b.host_user_id) || 'Host referral') : 'Direct booking',
      })) || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const response = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId, reason },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to cancel booking');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['vendorAllBookings'] });
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelMutation.mutate({ bookingId: selectedBooking.id, reason: cancelReason });
    }
  };

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
          <p className="text-sm text-muted-foreground">Complete list of your bookings</p>
        </div>

        <div className="border-t border-white/10">
          <div className="hidden grid-cols-[1.1fr_1.6fr_0.6fr_0.8fr_1.2fr_0.9fr_auto] gap-4 border-b border-white/10 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground md:grid">
            <span>When</span><span>Experience</span><span>Guests</span><span>Amount</span><span>Host</span><span>Status</span><span className="w-16" />
          </div>
          {isLoading ? (
            <SkeletonCardList count={4} variant="booking" />
          ) : bookings.length === 0 ? (
            <p className="py-10 text-sm text-muted-foreground">No bookings yet. They show up here as soon as a guest books.</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="grid gap-1 border-b border-white/10 py-4 text-sm md:grid-cols-[1.1fr_1.6fr_0.6fr_0.8fr_1.2fr_0.9fr_auto] md:items-center md:gap-4">
                <span className="text-muted-foreground">{formatDay(booking.date)} · {formatTime(booking.time) ?? "time not set"}</span>
                <span className="font-medium text-foreground">{booking.service}</span>
                <span className="text-muted-foreground"><span className="md:hidden">Guests: </span>{booking.guests}</span>
                <span className="tabular-nums text-foreground">{formatMoney(booking.amount)}</span>
                <span className="text-muted-foreground">{booking.host}</span>
                <span className="capitalize text-muted-foreground">{booking.status}</span>
                <span className="w-16 md:text-right">
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <button className="text-sm text-danger-strong hover:underline" onClick={() => handleCancelClick(booking)}>Cancel</button>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for "{selectedBooking?.service}"? 
              This action cannot be undone and notifications will be sent to the guest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason("")}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-danger-strong hover:bg-danger-deep"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VendorBottomNav />
    </div>
  );
};

export default AllBookings;