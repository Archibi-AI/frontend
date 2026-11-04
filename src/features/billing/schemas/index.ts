import { z } from "zod";

/** POST premium/subscriptions/stripe/cancel/ — frontend/billing/api/stripe-cancel.md */
export const CancelSubscriptionSchema = z.object({ message: z.string(), detail: z.string().nullish(), periodEnd: z.string().nullish() });
/** GET premium/subscriptions/{apple,google}/manage/ */
export const ManageUrlSchema = z.object({ manageUrl: z.string() });

/** GET premium/plans/ — frontend/billing/api/premium-plans.md. `amount` is in minor units (the app divides by 100). */
export const StripePlanSchema = z
  .object({
    productId: z.string(),
    creditsCount: z.number().int(),
    name: z.string(),
    image: z.string().nullish().transform((v) => v ?? ""),
    priceId: z.string(),
    amount: z.number().int(),
    currency: z.string(),
    appleProductId: z.string().nullish(),
    googleProductId: z.string().nullish(),
    playFormattedPrice: z.string().nullish(),
  })
  .passthrough();
export type StripePlan = z.infer<typeof StripePlanSchema>;
export const PremiumStripeProductsSchema = z.object({ userCredits: z.number().int().default(0), plans: z.array(StripePlanSchema).default([]) });
export type PremiumStripeProducts = z.infer<typeof PremiumStripeProductsSchema>;

/** SubscriptionPlan.kt (the Stripe-capable fields; the rest passes through). */
export const SubscriptionPlanSchema = z
  .object({
    uuid: z.number().int(),
    name: z.string(),
    maxCredits: z.number().int(),
    period: z.string(),
    platforms: z.string().default("all"),
    stripePriceId: z.string().nullish(),
    isActive: z.boolean().default(true),
    image: z.string().nullish().transform((v) => v ?? ""),
    amount: z.number().int().default(0),
    currency: z.string().default("usd"),
    shortDescription: z.string().nullish().transform((v) => v ?? ""),
    sortOrder: z.number().int().default(0),
    features: z.array(z.object({ uuid: z.string(), title: z.string(), iconUrl: z.string().nullish().transform((v) => v ?? "") })).default([]),
  })
  .passthrough();
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

/** GET premium/subscriptions/ — frontend/billing/api/subscriptions.md */
export const SubscriptionPlansSchema = z.object({
  userCredits: z.number().int().default(0),
  subscriptionCredits: z.number().int().default(0),
  purchasedCredits: z.number().int().default(0),
  plans: z.array(SubscriptionPlanSchema).default([]),
});
export type SubscriptionPlans = z.infer<typeof SubscriptionPlansSchema>;

/** GET premium/subscriptions/me/ — frontend/billing/api/subscriptions-me.md */
export const MySubscriptionSchema = z.object({
  subscriptionCredits: z.number().int().default(0),
  purchasedCredits: z.number().int().default(0),
  totalCredits: z.number().int().default(0),
  subscription: z
    .object({
      status: z.string(),
      autoRenew: z.boolean().default(true),
      periodEnd: z.string().nullish(),
      graceUntil: z.string().nullish(),
      isEntitled: z.boolean().default(false),
      plan: z.object({ uuid: z.number().int().nullish(), name: z.string(), maxCredits: z.number().int().default(0), period: z.string().default("month") }).nullish(),
    })
    .nullish(),
});
export type MySubscription = z.infer<typeof MySubscriptionSchema>;

/** POST premium/payments/create-intent/ — frontend/billing/api/payments-create-intent.md */
export const PaymentIntentSchema = z.object({ clientSecret: z.string(), publishableKey: z.string(), amount: z.number(), currency: z.string(), credits: z.number().int() });
export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;
export const IntentInputSchema = z.object({ priceId: z.string().min(1) });

/**
 * POST premium/payments/record/ — STRIPE branch only. `provider` is forced to "STRIPE" and a transaction id is
 * never accepted: a `transactionId` would route the call to the Apple branch (api/views.py:1490) and the web
 * must never send a "completed" claim that could credit (decision D15).
 */
export const RecordInputSchema = z
  .object({
    planId: z.string().min(1),
    status: z.enum(["completed", "canceled", "failed"]),
    price: z.number(),
    creditCount: z.number().int(),
    timestamp: z.string(),
    currency: z.string(),
    provider: z.literal("STRIPE").default("STRIPE"),
  })
  .strict();
export type RecordInput = z.infer<typeof RecordInputSchema>;
export const RecordResponseSchema = z.object({ message: z.string(), detail: z.string().nullish(), userCredits: z.number().int().nullish() });

/** POST premium/subscriptions/stripe/checkout/ — frontend/billing/api/stripe-checkout.md */
export const SubscriptionCheckoutSchema = z.object({
  clientSecret: z.string().nullish(),
  publishableKey: z.string(),
  stripeSubscriptionId: z.string(),
  plan: SubscriptionPlanSchema,
});
export type SubscriptionCheckout = z.infer<typeof SubscriptionCheckoutSchema>;
export const SubscriptionCheckoutInputSchema = z.object({ priceId: z.string().min(1) });

/** POST premium/enterprise/contact/ — 200 {url}; 503 {message} arrives as an AppError. */
export const EnterpriseContactSchema = z.object({ url: z.string().default(""), message: z.string().default("") });
export type EnterpriseContact = z.infer<typeof EnterpriseContactSchema>;
