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
  const base = { groups, subscriptionsUnavailable: false, me: null, userCredits: 12 };
  it("shows the app's copy, the plan options and the enterprise card (no render packs)", () => {
    renderWithProviders(<Paywall {...base} />);
    expect(screen.getByRole("heading", { name: "For people who design every day" })).toBeInTheDocument();
    expect(screen.getByText("12 renders available")).toBeInTheDocument();
    expect(screen.getByText("Save 17%")).toBeInTheDocument();
    expect(screen.getByText("Billed yearly")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade to Archibi Pro" })).toHaveAttribute("href", "/billing/checkout/subscription/price_y");
    expect(screen.queryByRole("heading", { name: "Renders" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Checkout" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Renders" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Are you an enterprise? Contact us" })).toBeInTheDocument();
  });
  it("switches the billing option", async () => {
    renderWithProviders(<Paywall {...base} />);
    await userEvent.click(screen.getByRole("radio", { name: /Billed monthly/ }));
    expect(screen.getByRole("link", { name: "Upgrade to Archibi Pro" })).toHaveAttribute("href", "/billing/checkout/subscription/price_m");
    expect(screen.getByText("Renews every month. Cancel anytime.")).toBeInTheDocument();
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
  it("a closed subscriptions gate shows the message and still offers the enterprise card (BI3)", () => {
    renderWithProviders(<Paywall {...base} groups={null} subscriptionsUnavailable />);
    expect(screen.getByText(/Subscriptions are not available yet/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Are you an enterprise? Contact us" })).toBeInTheDocument();
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
  it("subscription with no payment due skips the form and polls (SU1)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let polls = 0;
      server.use(
        http.post("*/bff/billing/subscription/checkout", () => HttpResponse.json({ clientSecret: null, publishableKey: "pk_mock_local", stripeSubscriptionId: "sub_1", plan: sub() }, { status: 201 })),
        http.get("*/bff/billing/subscription", () => { polls += 1; return HttpResponse.json({ subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: polls >= 2, plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month" } } }); }),
      );
      renderWithProviders(<CheckoutView kind="subscription" plan={{ ...pack, priceId: "price_m", productId: "3" }} period="month" />);
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
    renderWithProviders(<CheckoutView kind="subscription" plan={pack} period="month" />);
    expect(await screen.findByText("Subscriptions are not available yet.")).toBeInTheDocument();
  });
});

describe("ResultView (RS1, RS3)", () => {
  it("failed payments offer a retry link and no success banner", () => {
    renderWithProviders(<ResultView kind="subscription" plan={pack} id="price_m" status="failed" at={Date.UTC(2025, 5, 19, 14, 0)} />);
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/billing/checkout/subscription/price_m");
    expect(screen.getByRole("heading", { name: "Payment Rejected" })).toBeInTheDocument();
    expect(screen.queryByText(/renders will appear/)).not.toBeInTheDocument();
  });
  it("subscription processing shows the confirmation notice, then the receipt once entitled", async () => {
    server.use(http.get("*/bff/billing/subscription", () => HttpResponse.json({ subscriptionCredits: 50, purchasedCredits: 0, totalCredits: 50, subscription: { status: "active", autoRenew: true, isEntitled: true, plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month" } } })));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderWithProviders(<ResultView kind="subscription" plan={{ ...pack, name: "Archibi Pro" }} id="price_m" status="processing" months={1} at={Date.UTC(2025, 5, 19, 14, 0)} />);
      expect(screen.getByText("We're confirming your subscription")).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(5500);
      expect(await screen.findByRole("heading", { name: "Payment Accepted" })).toBeInTheDocument();
      expect(screen.getByText("Expires on")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
