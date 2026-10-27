import { RecordInputSchema } from "@/features/billing/schemas";
import { recordPayment } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

/** STRIPE branch only: `provider` is forced to "STRIPE" and transaction fields are rejected by the strict schema (D15). */
export const POST = bffHandler({ input: RecordInputSchema }, (input, { session }) => recordPayment(input, session));
