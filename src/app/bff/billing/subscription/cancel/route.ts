import { cancelStripeSubscription } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const POST = bffHandler({}, (_input, { session }) => cancelStripeSubscription(session));
