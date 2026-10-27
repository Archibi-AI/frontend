import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import { CancelSubscriptionSchema, ManageUrlSchema } from "../schemas";

// PaymentKtorRemoteSource.cancelStripeSubscription / getAppleManageUrl / getGoogleManageUrl

/** The app posts an empty JSON object. */
export const cancelStripeSubscription = (session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "premium/subscriptions/stripe/cancel/", body: { kind: "json", value: {} }, auth: "required", schema: CancelSubscriptionSchema, session });

export const getAppleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/apple/manage/", auth: "required", schema: ManageUrlSchema, session });

export const getGoogleManageUrl = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "premium/subscriptions/google/manage/", auth: "required", schema: ManageUrlSchema, session });
