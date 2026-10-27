import { describe, expect, it } from "vitest";
import type { AccountSummary } from "../schemas";
import { isFreePlan, planStatusLine, providerOf, rendersLine, topUpExpiryLine } from "./summary";

const plan = (over: Partial<AccountSummary["plan"]> = {}): AccountSummary["plan"] => ({
  kind: "subscription", name: "Pro", rendersRemaining: 38, rendersAllowance: 50, canUpgrade: false, ...over,
});

describe("account summary model", () => {
  it("providerOf maps the backend provider", () => {
    expect(providerOf(plan({ provider: "stripe" }))).toBe("stripe");
    expect(providerOf(plan({ provider: "APPLE_IAP" }))).toBe("apple");
    expect(providerOf(plan({ provider: "google_play" }))).toBe("google");
    expect(providerOf(plan({ provider: null }))).toBe("none");
  });
  it("free plan", () => {
    expect(isFreePlan(plan({ kind: "free", rendersAllowance: 0 }))).toBe(true);
    expect(isFreePlan(plan({ provider: "stripe" }))).toBe(false);
  });
  it("status line precedence: grace > ends > renews", () => {
    expect(planStatusLine(plan({ renewsOn: "2026-11-20" }))).toBe("Renews on Nov 20, 2026");
    expect(planStatusLine(plan({ renewsOn: "2026-11-20", endsOn: "2026-12-01" }))).toBe("Ends on Dec 1, 2026");
    expect(planStatusLine(plan({ endsOn: "2026-12-01", graceUntil: "2026-11-25" }))).toContain("Payment issue");
    expect(planStatusLine(plan())).toBe("");
  });
  it("renders line", () => {
    expect(rendersLine(plan({ allowancePeriod: "month" }))).toBe("38 of 50 renders left this month");
    expect(rendersLine(plan({ rendersAllowance: 0, rendersRemaining: 1 }))).toBe("1 render left");
  });
  it("top-up expiry", () => {
    expect(topUpExpiryLine({ rendersRemaining: 5, lots: [], nextExpiry: { rendersRemaining: 5, expiresOn: "2026-12-01", monthsLeft: 1 } })).toBe("5 renders expire on Dec 1, 2026");
    expect(topUpExpiryLine({ rendersRemaining: 0, lots: [] })).toBe("");
  });
});
