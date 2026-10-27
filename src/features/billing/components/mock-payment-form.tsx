"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { PaymentFormProps } from "./payment-form";

/** Stripe's published test numbers (https://docs.stripe.com/testing). Nothing here ever reaches Stripe. */
const SUCCESS = "4242424242424242";
const INSUFFICIENT_FUNDS = "4000000000009995";
const THREE_DS = "4000002760003184";

/** Local stand-in for the Payment Element in test mode: same props, same results, no network and no money. */
export function MockPaymentForm({ payLabel, onResult }: PaymentFormProps) {
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12 / 34");
  const [cvc, setCvc] = useState("123");
  const [challenge, setChallenge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function finish(status: "succeeded" | "failed") {
    setBusy(true);
    await onResult(status === "succeeded"
      ? { error: null, paymentIntent: { status: "succeeded" } }
      : { error: { type: "card_error", code: "authentication_failure", message: "We are unable to authenticate your payment method." }, paymentIntent: null });
    setBusy(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(undefined);
    const digits = card.replace(/\D/g, "");
    if (digits === SUCCESS) return finish("succeeded");
    if (digits === THREE_DS) return setChallenge(true);
    if (digits === INSUFFICIENT_FUNDS) {
      setBusy(true);
      await onResult({ error: { type: "card_error", code: "card_declined", message: "Your card has insufficient funds." }, paymentIntent: null });
      setBusy(false);
      return;
    }
    setError("Your card number is invalid.");
  }

  if (challenge) {
    return (
      <div className="space-y-4 rounded-md border border-line p-4" role="dialog" aria-label="3D Secure test challenge">
        <p className="text-sm font-bold text-ink-2">3D Secure authentication (test)</p>
        <p className="text-sm text-subtle">Your bank needs to confirm this payment.</p>
        <div className="flex gap-3">
          <Button loading={busy} onClick={() => finish("succeeded")}>Complete authentication</Button>
          <Button variant="secondary" disabled={busy} onClick={() => finish("failed")}>Fail authentication</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-sm bg-track px-3 py-2 text-xs text-muted">Test mode — no real card is charged. Try 4242 4242 4242 4242, 4000 0000 0000 9995 (declined) or 4000 0027 6000 3184 (3D Secure).</p>
      <Input label="Card number" inputMode="numeric" autoComplete="off" value={card} onChange={(e) => setCard(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Expiry" autoComplete="off" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        <Input label="CVC" inputMode="numeric" autoComplete="off" value={cvc} onChange={(e) => setCvc(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" loading={busy} className="w-full rounded-pill normal-case tracking-normal">
        <span className="text-base font-semibold">{payLabel}</span>
      </Button>
    </form>
  );
}
