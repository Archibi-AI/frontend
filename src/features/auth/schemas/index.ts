import { z } from "zod";

/** Web token pair added by the delegated endpoints (web/delegation.py) — frontend/foundation/api/token-refresh.md */
export const TokenPairSchema = z.object({
  access: z.string(),
  access_exp: z.number(),
  refresh: z.string(),
  refresh_exp: z.number(),
});

/** POST user/login/ — frontend/auth/api/login.md (mobile body − `token` + web pair) */
export const WebLoginResponseSchema = TokenPairSchema.extend({
  message: z.literal("User logged in Successfully"),
  uuid: z.string(),
  membership: z.string().nullish(),
  imageUri: z.string().nullish(),
  accountRestored: z.boolean().optional(),
});
export type WebLoginResponse = z.infer<typeof WebLoginResponseSchema>;

/** POST google_auth/ and apple_auth/ — frontend/auth/api/googleauth.md, appleauth.md */
export const SocialLoginResponseSchema = TokenPairSchema.extend({
  message: z.string(),
  uuid: z.string(),
  username: z.string().nullish(),
  email: z.string().nullish(),
  membership: z.string().nullish(),
  imageUri: z.string().nullish(),
  accountRestored: z.boolean().optional(),
});
export type SocialLoginResponse = z.infer<typeof SocialLoginResponseSchema>;

/** POST user/register/email-verification/ — frontend/auth/api/email-verification.md */
export const VerifyEmailResponseSchema = TokenPairSchema.extend({
  message: z.literal("Registered successfully!"),
  uuid: z.string(),
  username: z.string(),
  email: z.string(),
  membership: z.string().nullish(),
  imageUri: z.string().nullish(),
});
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;

/** POST user/register/onstep/ and user/password-recovery/ */
export const MessageSchema = z.object({ message: z.string() });

/** POST user/get-details/ — frontend/auth/api/get-details.md */
export const UserDetailsSchema = z.object({
  username: z.string(),
  email: z.string(),
  uuid: z.string(),
  imageUri: z.string().nullable().transform((v) => v ?? ""),
});
export type UserDetails = z.infer<typeof UserDetailsSchema>;

/** GET check-validation/ — frontend/auth/api/check-validation.md */
export const CheckValidationSchema = z.object({
  hasDeletedAccount: z.boolean(),
  newUsername: z.string().nullish(),
});

/** POST user/logout/ */
export const LogoutSchema = z.object({ message: z.string() });

/** BFF inputs (browser → /bff/auth/*) */
export const LoginInputSchema = z.object({ email: z.string().trim().min(1).max(254), password: z.string().min(1).max(200) });
export const SignupInputSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(8).max(200) });
export const VerifyInputSchema = z.object({ email: z.string().trim().email(), code: z.string().trim().regex(/^\d{4,8}$/) });
export const ForgotInputSchema = z.object({ email: z.string().trim().email().max(254) });
export const GoogleInputSchema = z.object({ credential: z.string().min(20) });
export const AppleInputSchema = z.object({ idToken: z.string().min(20) });
