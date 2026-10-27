import { toSessionUser, type AuthResult } from "@/features/auth/model/user";
import { VerifyInputSchema } from "@/features/auth/schemas";
import { verifySignUpEmail } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { writeSession } from "@/server/session/cookies";

/** Mirrors EmailVerificationViewModel (A3). The response already carries the user, so no A7. */
export const POST = bffHandler<{ email: string; code: string }, AuthResult>({ input: VerifyInputSchema }, async ({ email, code }, { session }) => {
  const res = await verifySignUpEmail(email, code);
  const user = toSessionUser(res, email);
  writeSession(session, res, user);
  return { user, accountRestored: false };
});
