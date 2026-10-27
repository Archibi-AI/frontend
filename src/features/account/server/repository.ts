import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import {
  AccountDeletionResponseSchema,
  AccountPrivacySchema,
  AccountSummarySchema,
  CreditsSchema,
  GeneratedImagesSchema,
  MessageSchema,
  TransactionsSchema,
  UpdateProfileResponseSchema,
} from "../schemas";

// Function names equal the Ktor data-source methods (AccountKtorRemoteDataSource, TransactionsKtorRemoteDataSource, UserProjectsKtorRemoteDataSource).

export const getAccountSummary = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/account/summary/", auth: "required", schema: AccountSummarySchema, session });

export const getPrivacyInfo = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/account/privacy/", auth: "required", schema: AccountPrivacySchema, session });

export const requestAccountDeletion = (confirmation: string, session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "user/account/delete/", body: { kind: "json", value: { confirmation } }, auth: "required", schema: AccountDeletionResponseSchema, session });

/** Multipart PUT exactly like the app: `username` only when non-blank, `profilePicture` only when present. */
export const updateUserProfile = (form: FormData, session?: SessionWriter) =>
  djangoFetch({ method: "PUT", path: "user/profile/", body: { kind: "multipart", form }, auth: "required", schema: UpdateProfileResponseSchema, session, timeoutMs: 60_000 });

export const changePasswordApi = (oldPassword: string, newPassword: string, confirmPassword: string, session?: SessionWriter) =>
  djangoFetch({
    method: "POST",
    path: "user/reset-password/",
    body: { kind: "form", fields: { old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword } },
    auth: "required",
    schema: MessageSchema,
    session,
  });

export const getTransactionPage = (page: number, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "account/transactions/", query: { page }, auth: "required", schema: TransactionsSchema, session });

/** The app always asks for type=all (the view ignores the value). */
export const getGalleryPage = (page: number, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/ai/gallery/", query: { type: "all", page }, auth: "required", schema: GeneratedImagesSchema, session });

export const getCreditsCount = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema: CreditsSchema, session });
