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
