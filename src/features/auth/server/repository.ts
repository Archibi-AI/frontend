import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import {
  CheckValidationSchema,
  LogoutSchema,
  MessageSchema,
  SocialLoginResponseSchema,
  UserDetailsSchema,
  VerifyEmailResponseSchema,
  WebLoginResponseSchema,
} from "../schemas";

// Function names equal the Ktor data-source methods (AuthKtorRemoteDataSource, GoogleAuth…, AppleAuth…).

/** A1 — form `username` (the app sends the email here) + `password`. */
export const logInUserToken = (username: string, password: string) =>
  djangoFetch({ method: "POST", path: "user/login/", body: { kind: "form", fields: { username, password } }, auth: "none", schema: WebLoginResponseSchema });

/** A2 */
export const userSignUpOneStep = (email: string, password: string) =>
  djangoFetch({ method: "POST", path: "user/register/onstep/", body: { kind: "form", fields: { email, password } }, auth: "none", schema: MessageSchema });

/** A3 — the app sends `verification_code`. */
export const verifySignUpEmail = (email: string, verificationCode: string) =>
  djangoFetch({ method: "POST", path: "user/register/email-verification/", body: { kind: "form", fields: { email, verification_code: verificationCode } }, auth: "none", schema: VerifyEmailResponseSchema });

/** A4 */
export const sendRecoveryEmail = (email: string) =>
  djangoFetch({ method: "POST", path: "user/password-recovery/", body: { kind: "form", fields: { email } }, auth: "none", schema: MessageSchema });

/** A5 */
export const verifyGoogleToken = (idToken: string) =>
  djangoFetch({ method: "POST", path: "google_auth/", body: { kind: "form", fields: { id_token: idToken } }, auth: "none", schema: SocialLoginResponseSchema });

/** A6 */
export const verifyAppleToken = (idToken: string) =>
  djangoFetch({ method: "POST", path: "apple_auth/", body: { kind: "form", fields: { id_token: idToken } }, auth: "none", schema: SocialLoginResponseSchema });

/** A7 — with a token obtained in this same request (login/verify/social) or the session's. */
export const getUserDetails = (session?: SessionWriter, accessOverride?: { access: string; userUuid: string }) =>
  djangoFetch({ method: "POST", path: "user/get-details/", auth: "required", schema: UserDetailsSchema, session, accessOverride });

/** A8 */
export const checkUserValidation = (username: string, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "check-validation/", query: { username }, auth: "required", schema: CheckValidationSchema, session });

/** A9 — web-only: blacklists the web refresh token. Never touches the app token. */
export const logOutUser = (refresh: string) =>
  djangoFetch({ method: "POST", path: "user/logout/", body: { kind: "json", value: { refresh } }, auth: "none", schema: LogoutSchema });
