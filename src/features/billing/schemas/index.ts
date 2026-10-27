import { z } from "zod";

/** POST premium/subscriptions/stripe/cancel/ — frontend/billing/api/stripe-cancel.md */
export const CancelSubscriptionSchema = z.object({ message: z.string(), detail: z.string().nullish(), periodEnd: z.string().nullish() });
/** GET premium/subscriptions/{apple,google}/manage/ */
export const ManageUrlSchema = z.object({ manageUrl: z.string() });
