import { getMySubscription } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({}, (_input, { session }) => getMySubscription(session));
