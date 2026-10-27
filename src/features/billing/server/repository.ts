import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import {
  CancelSubscriptionSchema,
  EnterpriseContactSchema,
  ManageUrlSchema,
  MySubscriptionSchema,
  PaymentIntentSchema,
  PremiumStripeProductsSchema,
  RecordResponseSchema,
  SubscriptionCheckoutSchema,
  SubscriptionPlansSchema,
  type RecordInput,
} from "../schemas";

// PaymentKtorRemoteSource.cancelStripeSubscription / getAppleManageUrl / getGoogleManageUrl

/** The app posts an empty JSON object. */
export const cancelStripeSubscription = (session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "premium/subscriptions/stripe/cancel/", body: { kind: "json", value: {} }, auth: "required", schema: CancelSubscriptionSchema, session });

export const getAppleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/apple/manage/", auth: "required", schema: ManageUrlSchema, session });

export const getGoogleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/google/manage/", auth: "required", schema: ManageUrlSchema, session });

// Names are the Ktor methods the app calls on the STRIPE path (frontend/billing/README.md, decision D14).

/** "Android" is historical: the app's STRIPE branch of fetchStripeProductsAPI calls this method (PaymentViewModel.kt:140-170). */
export const getAndroidStripeProducts = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/plans/", auth: "required", schema: PremiumStripeProductsSchema, session });

export const getSubscriptionPlans = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/", auth: "required", schema: SubscriptionPlansSchema, session });

export const getMySubscription = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/me/", auth: "required", schema: MySubscriptionSchema, session });

/** PaymentIntentRequest(price_id, currency.lowercase()) — PaymentViewModel.kt:648-660. */
export const createPaymentIntent = (priceId: string, currency: string, session?: SessionWriter) =>
  djangoFetch({
    method: "POST",
    path: "premium/payments/create-intent/",
    body: { kind: "json", value: { price_id: priceId, currency: currency.toLowerCase() } },
    auth: "required",
    schema: PaymentIntentSchema,
    session,
  });

/** recordPayment(TransactionRecords) — a non-crediting acknowledgement; credits come from the Stripe webhook. */
export const recordPayment = (input: RecordInput, session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "premium/payments/record/", body: { kind: "json", value: input }, auth: "required", schema: RecordResponseSchema, session });

export const createSubscriptionCheckout = (priceId: string, session?: SessionWriter) =>
  djangoFetch({
    method: "POST",
    path: "premium/subscriptions/stripe/checkout/",
    body: { kind: "json", value: { priceId } },
    auth: "required",
    schema: SubscriptionCheckoutSchema,
    session,
  });

/** requestEnterpriseContact(platform = "other") — STRIPE reports "other" (PaymentViewModel.kt:483-512, 595-600). */
export const requestEnterpriseContact = (session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "premium/enterprise/contact/", body: { kind: "json", value: { platform: "other" } }, auth: "required", schema: EnterpriseContactSchema, session });
