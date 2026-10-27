import { z } from "zod";

/** GET user/account/summary/ — frontend/account/api/account-summary.md (KMP AccountSummaryDC) */
const PlanSummary = z.object({
  kind: z.string(),
  name: z.string(),
  status: z.string().nullish(),
  provider: z.string().nullish(),
  rendersRemaining: z.number().int(),
  rendersAllowance: z.number().int(),
  allowancePeriod: z.string().nullish(),
  renewsOn: z.string().nullish(),
  endsOn: z.string().nullish(),
  graceUntil: z.string().nullish(),
  canUpgrade: z.boolean().default(false),
});
const TopUpLot = z.object({ rendersRemaining: z.number().int(), grantedOn: z.string().nullish(), expiresOn: z.string().nullish(), source: z.string() });
const TopUp = z.object({
  rendersRemaining: z.number().int(),
  nextExpiry: z.object({ rendersRemaining: z.number().int(), expiresOn: z.string(), monthsLeft: z.number().int().default(0) }).nullish(),
  lots: z.array(TopUpLot).default([]),
});
export const AccountSummarySchema = z.object({
  plan: PlanSummary,
  topUp: TopUp.nullish(),
  shareText: z.string().default(""),
  appVersion: z.object({ latestAndroid: z.string().nullish(), latestIos: z.string().nullish(), googlePlayUrl: z.string().nullish(), appStoreUrl: z.string().nullish() }).nullish(),
});
export type AccountSummary = z.infer<typeof AccountSummarySchema>;

/** GET user/account/privacy/ — frontend/account/api/account-privacy.md */
export const AccountPrivacySchema = z.object({
  privacyControlsText: z.string().default(""),
  helpBeforeDeletingUrl: z.string().nullish(),
  deletionGraceDays: z.number().int().default(30),
  confirmationWord: z.string().default("DELETE"),
});
export type AccountPrivacy = z.infer<typeof AccountPrivacySchema>;

/** POST user/account/delete/ — frontend/account/api/account-delete.md (202) */
export const AccountDeletionResponseSchema = z.object({ message: z.string(), deletionScheduledFor: z.string().nullish() });

/** PUT user/profile/ — frontend/account/api/user-profile.md */
export const UpdateProfileResponseSchema = z.object({
  message: z.string(),
  updatedUserData: z.object({ username: z.string(), imageUri: z.string().nullish(), isAdmin: z.boolean().optional() }),
});

/** POST user/reset-password/ */
export const MessageSchema = z.object({ message: z.string() });

/** GET account/transactions/ — frontend/account/api/account-transactions.md (extra keys kept) */
export const TransactionSchema = z.object({ uuid: z.string(), code: z.string(), status: z.string() }).passthrough();
export const TransactionsSchema = z.object({ transactions: z.array(TransactionSchema) });
export type Transaction = z.infer<typeof TransactionSchema>;

/** GET user/ai/gallery/ — frontend/account/api/user-ai-gallery.md */
export const GeneratedImageSchema = z.object({ uuid: z.number().int(), generatedImage: z.string(), googlePlayLink: z.string().optional() });
export const GeneratedImagesSchema = z.object({ generatedImages: z.array(GeneratedImageSchema) });
export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;

/** GET user/ai/credits/ — frontend/ai/api/user-ai-credits.md */
export const CreditsSchema = z.object({
  ai_credits: z.number().int(),
  service_access: z.object({ restricted: z.boolean().default(false), plan_name: z.string().nullish(), allowed_services: z.array(z.string()).default([]) }).nullish(),
  is_pro: z.boolean().nullish(),
});
export type Credits = z.infer<typeof CreditsSchema>;

/** BFF inputs */
export const PageInputSchema = z.object({ page: z.coerce.number().int().min(1).default(1) });
export const ChangePasswordInputSchema = z.object({ old_password: z.string().min(1), new_password: z.string().min(8), confirm_password: z.string().min(8) });
export const DeleteInputSchema = z.object({ confirmation: z.string().min(1) });
