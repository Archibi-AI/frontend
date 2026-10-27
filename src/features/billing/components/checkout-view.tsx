"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { PaywallText, formatPrice, periodMonths, type Period } from "../model/catalog";
import { outcomeOf, pollUntil, recordBody, type ConfirmResult } from "../model/checkout";
import type { MySubscription, PaymentIntent, StripePlan, SubscriptionCheckout } from "../schemas";
import { OrderSummary } from "./order-summary";
import { PaymentForm } from "./payment-form";
import { PolicyNote } from "./policy-note";

interface Ready { clientSecret: string | null; publishableKey: string; returnUrl: string }

export interface CheckoutViewProps {
  kind: "credits" | "subscription";
  /** The pack, or the subscription option in the app's StripePlan shape. */
  plan: StripePlan;
  period?: Period;
  /** Render balance when the page loaded, to recognise the webhook's top-up on the result page. */
  baselineCredits: number;
}

const BASELINE_KEY = "billing:baseline";

/**
 * credits: PaymentViewModel.initiatePayment → Payment Element → handlePaymentResult → recordPayment → receipt.
 * subscription: initiateSubscriptionCheckout → Payment Element → confirmSubscriptionActivated (4 × 2 000 ms) → receipt.
 */
export function CheckoutView({ kind, plan, period, baselineCredits }: CheckoutViewProps) {
  const router = useRouter();
  const [ready, setReady] = useState<Ready>();
  const [error, setError] = useState<string>();
  const [working, setWorking] = useState<string>();
  const started = useRef(false);
  const months = kind === "subscription" ? periodMonths(period ?? "month") : undefined;

  function goToResult(status: string) {
    router.push(routes.billing.result({ status, kind, id: plan.priceId, months, t: Date.now() }));
  }

  const returnUrlFor = () => `${window.location.origin}${routes.billing.result({ status: "completed", kind, id: plan.priceId, months, t: Date.now() })}`;

  // One PaymentIntent / Subscription per visit (React strict mode runs effects twice in development).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      sessionStorage.setItem(BASELINE_KEY, JSON.stringify({ id: plan.priceId, credits: baselineCredits }));
    } catch {
      // storage is a convenience only
    }
    (async () => {
      try {
        if (kind === "credits") {
          const intent = await bffFetch<PaymentIntent>("/bff/billing/credits/intent", jsonInit("POST", { priceId: plan.priceId }));
          setReady({ clientSecret: intent.clientSecret, publishableKey: intent.publishableKey, returnUrl: returnUrlFor() });
        } else {
          const checkout = await bffFetch<SubscriptionCheckout>("/bff/billing/subscription/checkout", jsonInit("POST", { priceId: plan.priceId }));
          if (!checkout.clientSecret) {
            // No payment is due: skip the form and go straight to waiting for the webhook.
            await waitForActivation();
            return;
          }
          setReady({ clientSecret: checkout.clientSecret, publishableKey: checkout.publishableKey, returnUrl: returnUrlFor() });
        }
      } catch (e) {
        setError(e instanceof AppError && e.code === "FORBIDDEN" ? "Subscriptions are not available yet." : e instanceof AppError ? e.message : "Something went wrong. Please try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per visit by design
  }, []);

  async function waitForActivation() {
    setWorking("Confirming your subscription…");
    const active = await pollUntil(async () => !!(await bffFetch<MySubscription>("/bff/billing/subscription")).subscription?.isEntitled, { attempts: 4, intervalMs: 2000 });
    goToResult(active ? "activated" : "processing");
  }

  async function onResult(result: ConfirmResult) {
    const outcome = outcomeOf(result);
    setWorking(outcome === "completed" ? "Payment received — finishing up…" : "Wrapping up…");
    if (kind === "credits") {
      // STRIPE records every outcome; the call never credits (credits come from the Stripe webhook).
      try {
        await bffFetch("/bff/billing/credits/record", jsonInit("POST", recordBody(plan, outcome, new Date())));
      } catch {
        // like the app: the webhook stays the authority, the receipt still shows
      }
      goToResult(outcome);
      return;
    }
    if (outcome !== "completed") return goToResult("failed");
    await waitForActivation();
  }

  const price = formatPrice(plan.amount, plan.currency);
  // Copied from the app's purchase button ("{price}, Purchase it now!").
  const payLabel = `${price}, Purchase it now!`;

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <OrderSummary plan={plan} kind={kind} period={period} />
      <section aria-labelledby="pay-title" className="rounded-lg border border-line bg-surface p-5 shadow-card md:p-6">
        <h2 id="pay-title" className="mb-4 font-display text-xl font-medium text-ink-2">Payment</h2>
        {error ? (
          <div role="alert" className="space-y-4">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => router.push(routes.billing.index(kind === "credits" ? "credits" : "subscriptions"))}>Back to plans</Button>
          </div>
        ) : working ? (
          <p role="status" className="py-8 text-center text-[15px] text-subtle">{working}</p>
        ) : ready?.clientSecret ? (
          <div className="space-y-4">
            <PaymentForm
              clientSecret={ready.clientSecret}
              publishableKey={ready.publishableKey}
              returnUrl={ready.returnUrl}
              payLabel={payLabel}
              onResult={onResult}
            />
            <PolicyNote />
          </div>
        ) : (
          <p role="status" className="py-8 text-center text-[15px] text-subtle">Preparing your checkout…</p>
        )}
        {kind === "subscription" && !error && <p className="mt-4 text-center text-xs text-subtle">{PaywallText.renewalLine(period ?? "month")}</p>}
      </section>
    </div>
  );
}
