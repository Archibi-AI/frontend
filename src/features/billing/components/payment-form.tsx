"use client";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import dynamic from "next/dynamic";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import type { ConfirmResult } from "../model/checkout";

export interface PaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  /** Where Stripe sends redirect-based methods and 3-D Secure fallbacks. */
  returnUrl: string;
  payLabel: string;
  /** Called for every real attempt (success, decline, cancel). Validation problems stay inline. */
  onResult: (result: ConfirmResult) => void | Promise<void>;
}

/** Test-mode stand-in for Stripe's iframe, used only when the backend hands out a `pk_mock_` key (local stack, never in production). */
export const MOCK_KEY_PREFIX = "pk_mock_";
const MockPaymentForm = dynamic(() => import("./mock-payment-form").then((m) => m.MockPaymentForm), {
  ssr: false,
  loading: () => <p role="status" className="py-8 text-center text-[15px] text-subtle">Preparing your checkout…</p>,
});

const stripeCache = new Map<string, Promise<Stripe | null>>();
const stripeFor = (key: string) => {
  let promise = stripeCache.get(key);
  if (!promise) {
    promise = loadStripe(key);
    stripeCache.set(key, promise);
  }
  return promise;
};

// Stripe draws inside its own iframe, so it needs literal values: the only hex colours outside the CSS tokens (architecture/09).
const APPEARANCE = { theme: "stripe" as const, variables: { colorPrimary: "#E70039", borderRadius: "5px", fontFamily: "DM Sans, system-ui" } };

/** The Payment Element (cards, plus Apple / Google Pay where the payment-method domain is registered — K6). */
export function PaymentForm(props: PaymentFormProps) {
  const stripe = useMemo(() => (props.publishableKey.startsWith(MOCK_KEY_PREFIX) ? null : stripeFor(props.publishableKey)), [props.publishableKey]);
  if (props.publishableKey.startsWith(MOCK_KEY_PREFIX)) return <MockPaymentForm {...props} />;
  return (
    <Elements stripe={stripe} options={{ clientSecret: props.clientSecret, appearance: APPEARANCE }}>
      <StripeFields {...props} />
    </Elements>
  );
}

function StripeFields({ returnUrl, payLabel, onResult }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError(undefined);
    const res = await stripe.confirmPayment({ elements, redirect: "if_required", confirmParams: { return_url: returnUrl } });
    if (res.error?.type === "validation_error") {
      setError(res.error.message);
      setBusy(false);
      return;
    }
    if (res.error?.message) setError(res.error.message);
    await onResult({
      error: res.error ? { type: res.error.type, code: res.error.code, message: res.error.message } : null,
      paymentIntent: res.paymentIntent ? { status: res.paymentIntent.status } : null,
    });
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" loading={busy} disabled={!stripe || !elements} className="w-full rounded-pill normal-case tracking-normal">
        <span className="text-base font-semibold">{payLabel}</span>
      </Button>
    </form>
  );
}
