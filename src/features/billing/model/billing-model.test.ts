import { describe, expect, it, vi } from "vitest";
import type { MySubscription, SubscriptionPlan } from "../schemas";
import { defaultPeriod, formatPrice, isCurrentOption, splitPlanTitle, stripePlanGroups, yearlyFullPrice, yearlySavingsPercent } from "./catalog";
import { outcomeOf, pollUntil, recordBody } from "./checkout";
import { barcodeValue, buildReceipt, fallbackInvoiceId, formatReceiptDateTime, receiptShareText, receiptStatusOf } from "./receipt";
import { resolveReturnStatus, statusOfIntent } from "./result";
import { RecordInputSchema } from "../schemas";

const plan = (over: Partial<SubscriptionPlan> = {}): SubscriptionPlan => ({
  uuid: 3, name: "Pro", maxCredits: 50, period: "month", platforms: "stripe", stripePriceId: "price_m", isActive: true, image: "", amount: 1999, currency: "cad", ...over,
});

describe("prices (BI1)", () => {
  it("formats minor units like the app", () => {
    expect(formatPrice(999, "usd")).toBe("$9.99");
    expect(formatPrice(1999, "cad")).toBe("19.99 CAD");
    expect(formatPrice(123456789, "usd")).toBe("$1,234,567.89");
    expect(formatPrice(-5, "usd")).toBe("$0.00");
  });
});

describe("subscription catalogue (BI2, BI4)", () => {
  it("keeps only active, Stripe-priced, website plans and groups month + year under one name", () => {
    const groups = stripePlanGroups([
      plan({ uuid: 4, period: "year", stripePriceId: "price_y", amount: 19900 }),
      plan(),
      plan({ uuid: 5, name: "Mobile only", platforms: "both", stripePriceId: "price_x" }),
      plan({ uuid: 6, name: "No price", stripePriceId: null }),
      plan({ uuid: 7, name: "Retired", isActive: false, stripePriceId: "price_r" }),
      plan({ uuid: 8, name: "Free", stripePriceId: "price_free", amount: 0 }),
      plan({ uuid: 9, name: "Everywhere", platforms: "all", stripePriceId: "price_all" }),
    ]);
    expect(groups.map((g) => g.name)).toEqual(["Pro", "Everywhere"]);
    expect(groups[0]!.options.map((o) => o.period)).toEqual(["month", "year"]);
    expect(defaultPeriod(groups[0]!.options)).toBe("year");
  });
  it("computes the yearly saving and the struck-through price", () => {
    const [group] = stripePlanGroups([plan(), plan({ uuid: 4, period: "year", stripePriceId: "price_y", amount: 19900 })]);
    const monthly = group!.options[0], yearly = group!.options[1];
    expect(yearlySavingsPercent(monthly, yearly)).toBe(17);
    expect(yearlyFullPrice(monthly, yearly)).toBe("239.88 CAD");
    expect(yearlySavingsPercent(monthly, { ...yearly!, amount: 30000 })).toBeNull();
  });
  it("marks the current plan only for the same row and period, and only when entitled", () => {
    const [group] = stripePlanGroups([plan()]);
    const me = (over: Partial<NonNullable<MySubscription["subscription"]>> = {}): MySubscription => ({
      subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50,
      subscription: { status: "active", autoRenew: true, isEntitled: true, plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month" }, ...over },
    });
    expect(isCurrentOption(me(), group!.options[0]!)).toBe(true);
    expect(isCurrentOption(me({ isEntitled: false }), group!.options[0]!)).toBe(false);
    expect(isCurrentOption(me({ plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "year" } }), group!.options[0]!)).toBe(false);
    expect(isCurrentOption(null, group!.options[0]!)).toBe(false);
  });
  it("colours the last word of the title", () => {
    expect(splitPlanTitle("Archibi Studio")).toEqual(["Archibi ", "Studio"]);
    expect(splitPlanTitle("Pro")).toEqual(["Pro", ""]);
  });
});

describe("payment outcome and record body (CK1–CK4)", () => {
  it("maps Stripe results like handlePaymentResult", () => {
    expect(outcomeOf({ paymentIntent: { status: "succeeded" } })).toBe("completed");
    expect(outcomeOf({ paymentIntent: { status: "processing" } })).toBe("completed");
    expect(outcomeOf({ paymentIntent: { status: "canceled" } })).toBe("canceled");
    expect(outcomeOf({ error: { code: "card_declined" }, paymentIntent: { status: "requires_payment_method" } })).toBe("failed");
    expect(outcomeOf({ error: { code: "payment_intent_authentication_failure" } })).toBe("failed");
    expect(outcomeOf({})).toBe("failed");
  });
  it("builds a STRIPE record in major units, lowercase currency", () => {
    const body = recordBody({ productId: "price_p", priceId: "price_p", name: "20 renders", image: "", creditsCount: 20, amount: 999, currency: "USD" }, "failed", new Date("2026-10-27T10:15:30Z"));
    expect(body).toEqual({ planId: "price_p", status: "failed", price: 9.99, creditCount: 20, timestamp: "2026-10-27 10:15:30", currency: "usd", provider: "STRIPE" });
  });
  it("the BFF schema refuses anything that could leave the Stripe branch", () => {
    const ok = recordBody({ productId: "p", priceId: "p", name: "n", image: "", creditsCount: 1, amount: 100, currency: "usd" }, "completed", new Date());
    expect(RecordInputSchema.safeParse(ok).success).toBe(true);
    expect(RecordInputSchema.safeParse({ ...ok, transactionId: "1" }).success).toBe(false);
    expect(RecordInputSchema.safeParse({ ...ok, provider: "APPLE_IAP" }).success).toBe(false);
    expect(RecordInputSchema.safeParse({ ...ok, signedTransactionInfo: "x" }).success).toBe(false);
    expect(RecordInputSchema.safeParse({ ...ok, status: "refunded" }).success).toBe(false);
  });
});

describe("activation polling (SU2, SU3)", () => {
  it("polls 4 × 2 s and gives up", async () => {
    const waits: number[] = [];
    const read = vi.fn().mockResolvedValue(false);
    expect(await pollUntil(read, { attempts: 4, intervalMs: 2000, wait: async (ms) => void waits.push(ms) })).toBe(false);
    expect(read).toHaveBeenCalledTimes(4);
    expect(waits).toEqual([2000, 2000, 2000, 2000]);
  });
  it("stops as soon as the subscription is entitled", async () => {
    const read = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(await pollUntil(read, { attempts: 4, intervalMs: 2000, wait: async () => undefined })).toBe(true);
    expect(read).toHaveBeenCalledTimes(2);
  });
  it("counts a failed read as not yet", async () => {
    const read = vi.fn().mockRejectedValueOnce(new Error("net")).mockResolvedValueOnce(true);
    expect(await pollUntil(read, { attempts: 4, intervalMs: 1, wait: async () => undefined })).toBe(true);
  });
});

describe("receipt (RS1–RS3)", () => {
  it("translates statuses like PaymentReceiptStatus.from", () => {
    for (const s of ["completed", " Succeeded ", "activated"]) expect(receiptStatusOf(s)).toBe("accepted");
    for (const s of ["canceled", "CANCELLED"]) expect(receiptStatusOf(s)).toBe("canceled");
    for (const s of ["failed", "processing", ""]) expect(receiptStatusOf(s)).toBe("rejected");
  });
  it("derives the app's stable invoice id", () => {
    expect(fallbackInvoiceId("price_1", "price_1", "20 renders")).toMatch(/^URT-\d{4}-\d{6}$/);
    expect(fallbackInvoiceId("a", null, "b")).toBe(fallbackInvoiceId("a", "b"));
    expect(fallbackInvoiceId()).toBe("URT-0000-000000");
    // hand-checked against the Kotlin rolling hash: "ab" = (97 * 31) + 98 = 3105
    expect(fallbackInvoiceId("ab")).toBe("URT-0000-003105");
  });
  it("barcode stub", () => {
    expect(barcodeValue("URT-0000-003105")).toBe("00000000003105");
    expect(barcodeValue("abc")).toBe("00000000000294");
  });
  it("formats the date like the app and prints an expiry for subscriptions", () => {
    const at = new Date(2025, 5, 19, 10, 5);
    expect(formatReceiptDateTime(at)).toBe("19 Jun 2025 • 10:05");
    expect(formatReceiptDateTime(at, 12)).toBe("19 Jun 2026 • 10:05");
    const receipt = buildReceipt({ plan: { productId: "3", priceId: "price_m", name: "Pro", image: "", creditsCount: 50, amount: 1999, currency: "cad" }, status: "activated", at, months: 1 });
    expect(receipt).toMatchObject({ status: "accepted", amount: "19.99 CAD", creditsCount: 50, providerName: "Stripe", expiresAt: "19 Jul 2025 • 10:05" });
    expect(receiptShareText(receipt)).toBe(
      `Archibi — Payment Accepted\n\nPlan: Pro\nInvoice ID: ${receipt.invoiceId}\nAmount: 19.99 CAD\nCredits: 50\nPaid with: Stripe\nDate: 19 Jun 2025 • 10:05\nExpires: 19 Jul 2025 • 10:05`,
    );
  });
  it("resolves a 3-D Secure return (RS2)", () => {
    expect(resolveReturnStatus("completed", "failed")).toBe("failed");
    expect(resolveReturnStatus("completed", "succeeded")).toBe("completed");
    expect(resolveReturnStatus("failed", undefined)).toBe("failed");
    expect(statusOfIntent("requires_payment_method")).toBe("failed");
    expect(statusOfIntent("succeeded")).toBe("completed");
    expect(statusOfIntent("requires_action")).toBeUndefined();
  });
});
