import { describe, it, expect } from "vitest";
import { formatMoney, formatTime, formatDay } from "../src/lib/format";

describe("format", () => {
  it("money has two decimals", () => {
    expect(formatMoney(122.4)).toBe("$122.40");
    expect(formatMoney(1500)).toBe("$1,500.00");
    expect(formatMoney(null)).toBe("$0.00");
  });
  it("time is 12h", () => {
    expect(formatTime("14:30:00")).toBe("2:30 PM");
    expect(formatTime("09:05")).toBe("9:05 AM");
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime(null)).toBeNull();
  });
  it("day is local", () => {
    expect(formatDay("2026-11-02")).toBe("Mon, Nov 2");
  });
});
