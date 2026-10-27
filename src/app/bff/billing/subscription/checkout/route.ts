import { SubscriptionCheckoutInputSchema } from "@/features/billing/schemas";
import { createSubscriptionCheckout } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const POST = bffHandler({ input: SubscriptionCheckoutInputSchema }, ({ priceId }, { session }) => createSubscriptionCheckout(priceId, session));
