import { getAndroidStripeProducts } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({}, (_input, { session }) => getAndroidStripeProducts(session));
