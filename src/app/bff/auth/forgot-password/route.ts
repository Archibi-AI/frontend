import { ForgotInputSchema } from "@/features/auth/schemas";
import { sendRecoveryEmail } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";

/** Mirrors PasswordRecoveryViewModel.sendRecoveryEmail (A4); X-Forwarded-For keeps the throttle per user IP. */
export const POST = bffHandler({ input: ForgotInputSchema }, ({ email }) => sendRecoveryEmail(email));
