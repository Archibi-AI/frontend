import type { RecordInput } from "../schemas";
import type { StripePlan } from "../schemas";

export type PaymentOutcome = "completed" | "canceled" | "failed";

/** Shape of what `stripe.confirmPayment` resolves to (only the fields we read). */
export interface ConfirmResult {
  error?: { type?: string; code?: string; message?: string } | null;
  paymentIntent?: { status?: string } | null;
}

/**
 * PaymentViewModel.handlePaymentResult (AppPaymentResult.Completed / Canceled / Failed).
 * succeeded and processing both count as completed — the webhook, not the browser, grants credits.
 */
export function outcomeOf(result: ConfirmResult): PaymentOutcome {
  const status = result.paymentIntent?.status;
  if (!result.error && (status === "succeeded" || status === "processing")) return "completed";
  if (status === "canceled") return "canceled";
  return "failed";
}

/** TransactionRecords for the STRIPE branch — never a transaction id; the BFF forces provider STRIPE (D15). */
export function recordBody(plan: StripePlan, status: PaymentOutcome, at: Date): RecordInput {
  return {
    planId: plan.productId,
    status,
    price: plan.amount / 100,
    creditCount: plan.creditsCount,
    timestamp: at.toISOString().slice(0, 19).replace("T", " "),
    currency: plan.currency.toLowerCase(),
    provider: "STRIPE",
  };
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * confirmSubscriptionActivated: poll up to `attempts` times, `intervalMs` apart; true as soon as `isActive()` is.
 * The app waits before each read (4 × 2 000 ms), because the webhook needs a moment.
 */
export async function pollUntil(isActive: () => Promise<boolean>, opts: { attempts: number; intervalMs: number; wait?: (ms: number) => Promise<void> }): Promise<boolean> {
  const wait = opts.wait ?? sleep;
  for (let i = 0; i < opts.attempts; i += 1) {
    await wait(opts.intervalMs);
    try {
      if (await isActive()) return true;
    } catch {
      // a failed read counts as "not yet", exactly like the app
    }
  }
  return false;
}
