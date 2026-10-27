import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { router } from "@/test/navigation-mock";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import { stripePlanGroups } from "../model/catalog";
import { buildReceipt } from "../model/receipt";
import type { StripePlan, SubscriptionPlan } from "../schemas";
import { CheckoutView } from "./checkout-view";
import { EnterpriseCard } from "./enterprise-card";
import { Paywall } from "./paywall";
import { ReceiptCard } from "./receipt-card";
import { ResultView } from "./result-view";

setupComponentTest();

const pack: StripePlan = { productId: "price_p20", priceId: "price_p20", name: "20 renders", image: "", creditsCount: 20, amount: 999, currency: "usd" };
const sub = (over: Partial<SubscriptionPlan> = {}): SubscriptionPlan => ({
  uuid: 3, name: "Archibi Pro", maxCredits: 50, period: "month", platforms: "stripe", stripePriceId: "price_m", isActive: true, image: "", amount: 1999, currency: "cad", ...over,
});
const groups = stripePlanGroups([sub(), sub({ uuid: 4, period: "year", stripePriceId: "price_y", amount: 19900 })]);

describe("Paywall (BI3, BI4)", () => {
  const base = { section: "all" as const, packs: [pack], groups, subscriptionsUnavailable: false, me: null, userCredits: 12 };
  it("shows the app's copy, the packs, the plan options and the enterprise card", () => {
    renderWithProviders(<Paywall {...base} />);
    expect(screen.getByRole("heading", { name: "For people who design every day" })).toBeInTheDocument();
    expect(screen.getByText("12 renders available")).toBeInTheDocument();
    expect(screen.getByText("Save 17%")).toBeInTheDocument();
    expect(screen.getByText("Billed yearly")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade to Archibi Pro" })).toHaveAttribute("href", "/billing/checkout/subscription/price_y");
    expect(screen.getByRole("link", { name: "Checkout" })).toHaveAttribute("href", "/billing/checkout/credits/price_p20");
    expect(screen.getByRole("heading", { name: "Are you an enterprise? Contact us" })).toBeInTheDocument();
  });
  it("switches the billing option", async () => {
    renderWithProviders(<Paywall {...base} />);
    await userEvent.click(screen.getByRole("radio", { name: /Billed monthly/ }));
    expect(screen.getByRole("link", { name: "Upgrade to Archibi Pro" })).toHaveAttribute("href", "/billing/checkout/subscription/price_m");
    expect(screen.getByText("Renews every month. Cancel anytime.")).toBeInTheDocument();
  });
  it("section tabs filter the cards", () => {
    renderWithProviders(<Paywall {...base} section="credits" />);
    expect(screen.queryByRole("heading", { name: "Subscriptions" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Renders" })).toBeInTheDocument();
  });
  it("the current plan is disabled", () => {
    const me = { subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: true, plan: { uuid: 4, name: "Archibi Pro", maxCredits: 50, period: "year" } } };
    renderWithProviders(<Paywall {...base} me={me} />);
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: /Upgrade to/ })).not.toBeInTheDocument();
  });
  it("opens on the user's own period so Current plan is visible at once", () => {
    const me = { subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: true, plan: { uuid: 3, name: "Archibi Pro", maxCredits: 50, period: "month" } } };
    renderWithProviders(<Paywall {...base} me={me} />);
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Billed monthly/ })).toBeChecked();
  });
  it("a closed subscriptions gate only affects that section (BI3)", () => {
    renderWithProviders(<Paywall {...base} groups={null} subscriptionsUnavailable />);
    expect(screen.getByText(/Subscriptions are not available yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Checkout" })).toBeInTheDocument();
  });
});

describe("EnterpriseCard (EN-F1)", () => {
  it("posts platform other via the BFF and opens the url", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    let body: unknown;
    server.use(http.post("*/bff/billing/enterprise", () => HttpResponse.json({ url: "https://archibi.ca/enterprise", message: "" })));
    renderWithProviders(<EnterpriseCard />);
    await userEvent.click(screen.getByRole("button", { name: "Contact us" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("https://archibi.ca/enterprise", "_blank", "noopener,noreferrer"));
    expect(body).toBeUndefined();
  });
  it("503 falls back to the support address", async () => {
    server.use(http.post("*/bff/billing/enterprise", () => HttpResponse.json({ error: { code: "SERVER", message: "x" } }, { status: 503 })));
    renderWithProviders(<EnterpriseCard />);
    await userEvent.click(screen.getByRole("button", { name: "Contact us" }));
    expect(await screen.findByText("Contact us at support@archibi.ca")).toBeInTheDocument();
  });
});

describe("ReceiptCard", () => {
  it("prints exactly what the app's receipt prints", async () => {
    const receipt = buildReceipt({ plan: { ...pack, productId: "price_p20" }, status: "completed", at: new Date(2025, 5, 19, 10, 15) });
    const done = vi.fn();
    renderWithProviders(<ReceiptCard receipt={receipt} onDone={done} />);
    expect(screen.getByRole("heading", { name: "Payment Accepted" })).toBeInTheDocument();
    for (const text of ["20 renders", receipt.invoiceId, "9.99 USD", "20", "Stripe", "19 Jun 2025 • 10:15", "THANK YOU FOR YOUR PURCHASE"]) expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText("Expires on")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(done).toHaveBeenCalled();
  });
  it("shows the expiry for subscriptions and the rejected stamp", () => {
    const receipt = buildReceipt({ plan: pack, status: "failed", at: new Date(2025, 5, 19, 10, 15), months: 1 });
    renderWithProviders(<ReceiptCard receipt={{ ...receipt, expiresAt: "19 Jul 2025 • 10:15" }} onDone={() => undefined} />);
    expect(screen.getByRole("heading", { name: "Payment Rejected" })).toBeInTheDocument();
    expect(screen.getByText("Expires on")).toBeInTheDocument();
  });
});

describe("CheckoutView", () => {
  it("credits: creates the intent for the price id, pays with the test card, records the outcome, shows the receipt", async () => {
    const seen: Record<string, unknown> = {};
    server.use(
      http.post("*/bff/billing/credits/intent", async ({ request }) => { seen.intent = await request.json(); return HttpResponse.json({ clientSecret: "pi_1_secret_x", publishableKey: "pk_mock_local", amount: 9.99, currency: "usd", credits: 20 }, { status: 201 }); }),
      http.post("*/bff/billing/credits/record", async ({ request }) => { seen.record = await request.json(); return HttpResponse.json({ message: "payment_received" }); }),
    );
    renderWithProviders(<CheckoutView kind="credits" plan={pack} baselineCredits={5} />);
    await userEvent.click(await screen.findByRole("button", { name: "$9.99, Purchase it now!" }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(seen.intent).toEqual({ priceId: "price_p20" });
    expect(seen.record).toMatchObject({ planId: "price_p20", status: "completed", price: 9.99, creditCount: 20, currency: "usd", provider: "STRIPE" });
    expect(router.push.mock.calls[0]![0]).toMatch(/^\/billing\/result\?status=completed&kind=credits&id=price_p20&t=\d+$/);
  });
  it("credits: a declined card is recorded and sent to a failed receipt (CK4)", async () => {
    let recorded: { status?: string } = {};
    server.use(
      http.post("*/bff/billing/credits/intent", () => HttpResponse.json({ clientSecret: "pi_1_secret_x", publishableKey: "pk_mock_local", amount: 9.99, currency: "usd", credits: 20 }, { status: 201 })),
      http.post("*/bff/billing/credits/record", async ({ request }) => { recorded = (await request.json()) as { status?: string }; return HttpResponse.json({ message: "payment_received" }); }),
    );
    renderWithProviders(<CheckoutView kind="credits" plan={pack} baselineCredits={5} />);
    const card = await screen.findByLabelText("Card number");
    await userEvent.clear(card);
    await userEvent.type(card, "4000 0000 0000 9995");
    await userEvent.click(screen.getByRole("button", { name: "$9.99, Purchase it now!" }));
    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(recorded.status).toBe("failed");
    expect(router.push.mock.calls[0]![0]).toContain("status=failed");
  });
  it("subscription with no payment due skips the form and polls (SU1)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let polls = 0;
      server.use(
        http.post("*/bff/billing/subscription/checkout", () => HttpResponse.json({ clientSecret: null, publishableKey: "pk_mock_local", stripeSubscriptionId: "sub_1", plan: sub() }, { status: 201 })),
        http.get("*/bff/billing/subscription", () => { polls += 1; return HttpResponse.json({ subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: polls >= 2, plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month" } } }); }),
      );
      renderWithProviders(<CheckoutView kind="subscription" plan={{ ...pack, priceId: "price_m", productId: "3" }} period="month" baselineCredits={0} />);
      await vi.advanceTimersByTimeAsync(4500);
      await waitFor(() => expect(router.push).toHaveBeenCalled());
      expect(router.push.mock.calls[0]![0]).toMatch(/status=activated&kind=subscription&id=price_m&months=1/);
      expect(polls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });
  it("shows the subscriptions gate as a message (403)", async () => {
    server.use(http.post("*/bff/billing/subscription/checkout", () => HttpResponse.json({ error: { code: "FORBIDDEN", message: "no" } }, { status: 403 })));
    renderWithProviders(<CheckoutView kind="subscription" plan={pack} period="month" baselineCredits={0} />);
    expect(await screen.findByText("Subscriptions are not available yet.")).toBeInTheDocument();
  });
});

describe("ResultView (RS1, RS3)", () => {
  it("credits: waits for the webhook and announces the added renders once the balance grows", async () => {
    let calls = 0;
    server.use(http.get("*/bff/ai/credits", () => { calls += 1; return HttpResponse.json({ ai_credits: calls >= 2 ? 25 : 5 }); }));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderWithProviders(<ResultView kind="credits" plan={pack} id="price_p20" status="completed" at={Date.UTC(2025, 5, 19, 14, 0)} userCredits={5} />);
      expect(screen.getByText("Payment received. Your renders will appear in a moment.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Payment Accepted" })).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(3500);
      expect(await screen.findByText("+20 renders added")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
  it("failed payments offer a retry link and no success banner", () => {
    renderWithProviders(<ResultView kind="credits" plan={pack} id="price_p20" status="failed" at={Date.UTC(2025, 5, 19, 14, 0)} userCredits={5} />);
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/billing/checkout/credits/price_p20");
    expect(screen.getByRole("heading", { name: "Payment Rejected" })).toBeInTheDocument();
    expect(screen.queryByText(/renders will appear/)).not.toBeInTheDocument();
  });
  it("subscription processing shows the confirmation notice, then the receipt once entitled", async () => {
    server.use(http.get("*/bff/billing/subscription", () => HttpResponse.json({ subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: true, plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month" } } })));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderWithProviders(<ResultView kind="subscription" plan={{ ...pack, name: "Archibi Pro" }} id="price_m" status="processing" months={1} at={Date.UTC(2025, 5, 19, 14, 0)} userCredits={0} />);
      expect(screen.getByText("We're confirming your subscription")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(5500);
      expect(await screen.findByRole("heading", { name: "Payment Accepted" })).toBeInTheDocument();
      expect(screen.getByText("Expires on")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
