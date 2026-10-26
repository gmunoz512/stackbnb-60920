const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Money is always shown with two decimals: $122.40 */
export const formatMoney = (n: number | null | undefined) => usd.format(Number(n) || 0);

/** "14:30:00" → "2:30 PM"; null when there is no time. */
export function formatTime(t: string | null | undefined): string | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

/** "2026-11-02" → "Mon, Nov 2" (parsed as a local date, no timezone shift). */
export function formatDay(d: string | null | undefined): string {
  if (!d) return "";
  const [y, mo, da] = d.split("-").map(Number);
  if (!y || !mo || !da) return d;
  return new Date(y, mo - 1, da).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** Local calendar date as YYYY-MM-DD (booking_date is a plain date column). */
export function localISODate(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type BookingPhase = "upcoming" | "completed" | "awaiting" | "cancelled";

/**
 * Where a booking sits relative to today. Status wins for completed/cancelled;
 * an open booking is upcoming only if its date is today or later, otherwise it
 * is past its date and still waiting to be marked completed.
 */
export function bookingPhase(b: { status?: string | null; booking_date?: string | null }, today = localISODate()): BookingPhase {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "completed") return "completed";
  if (b.booking_date && b.booking_date < today) return "awaiting";
  return "upcoming";
}
