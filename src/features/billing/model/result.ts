/**
 * Stripe appends `redirect_status` (succeeded | pending | failed) when it sends the buyer back to `return_url`
 * (3-D Secure fallbacks, redirect-based methods). That outranks the optimistic `status=completed` we put in the URL.
 */
export function resolveReturnStatus(status: string, redirectStatus: string | undefined): string {
  switch (redirectStatus) {
    case "succeeded": case "pending": return "completed";
    case "failed": return "failed";
    default: return status;
  }
}

/** Same mapping for a PaymentIntent retrieved with `stripe.retrievePaymentIntent`. */
export function statusOfIntent(intentStatus: string | undefined): string | undefined {
  if (intentStatus === "succeeded" || intentStatus === "processing") return "completed";
  if (intentStatus === "canceled") return "canceled";
  if (intentStatus === "requires_payment_method") return "failed";
  return undefined;
}

/** What the page says above the receipt while the webhook catches up. */
export type CreditsBanner = "waiting" | "added" | "slow";
