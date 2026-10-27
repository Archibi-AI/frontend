import { IntentInputSchema } from "@/features/billing/schemas";
import { createPaymentIntent, getAndroidStripeProducts } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { AppError } from "@/shared/errors/app-error";

/** The browser sends only the price id; amount and currency come from the catalogue, never from the client. */
export const POST = bffHandler({ input: IntentInputSchema }, async ({ priceId }, { session }) => {
  const { plans } = await getAndroidStripeProducts(session);
  const plan = plans.find((p) => p.priceId === priceId);
  if (!plan) throw new AppError("NOT_FOUND", 404, "Unknown credit pack");
  return createPaymentIntent(plan.priceId, plan.currency, session);
});
