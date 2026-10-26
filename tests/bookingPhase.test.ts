import { describe, it, expect } from "vitest";
import { bookingPhase } from "../src/lib/format";
const T = "2026-10-26";
describe("bookingPhase", () => {
  it("future confirmed is upcoming", () => expect(bookingPhase({ status: "confirmed", booking_date: "2026-10-27" }, T)).toBe("upcoming"));
  it("today is upcoming", () => expect(bookingPhase({ status: "pending", booking_date: T }, T)).toBe("upcoming"));
  it("past open booking is awaiting", () => expect(bookingPhase({ status: "confirmed", booking_date: "2026-10-20" }, T)).toBe("awaiting"));
  it("completed is never upcoming", () => expect(bookingPhase({ status: "completed", booking_date: "2026-10-28" }, T)).toBe("completed"));
  it("cancelled stays cancelled", () => expect(bookingPhase({ status: "cancelled", booking_date: "2026-10-28" }, T)).toBe("cancelled"));
});
