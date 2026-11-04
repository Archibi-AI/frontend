import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import {
  CancelSubscriptionSchema,
  EnterpriseContactSchema,
  ManageUrlSchema,
  MySubscriptionSchema,
  SubscriptionCheckoutSchema,
  SubscriptionPlansSchema,
} from "../schemas";

// PaymentKtorRemoteSource.cancelStripeSubscription / getAppleManageUrl / getGoogleManageUrl

/** The app posts an empty JSON object. */
export const cancelStripeSubscription = (session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "premium/subscriptions/stripe/cancel/", body: { kind: "json", value: {} }, auth: "required", schema: CancelSubscriptionSchema, session });

export const getAppleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/apple/manage/", auth: "required", schema: ManageUrlSchema, session });

export const getGoogleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/google/manage/", auth: "required", schema: ManageUrlSchema, session });

// Names are the Ktor methods the app calls on the STRIPE path (frontend/billing/README.md). Render packs are not sold on the web.

export const getSubscriptionPlans = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/", auth: "required", schema: SubscriptionPlansSchema, session });

export const getMySubscription = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/me/", auth: "required", schema: MySubscriptionSchema, session });

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
