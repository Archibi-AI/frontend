import { toSessionUser, type AuthResult } from "@/features/auth/model/user";
import { AppleInputSchema } from "@/features/auth/schemas";
import { verifyAppleToken } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { writeSession } from "@/server/session/cookies";

/** Mirrors AppleAuthViewModel (A6): popup flow from Sign in with Apple JS. */
export const POST = bffHandler<{ idToken: string }, AuthResult>({ input: AppleInputSchema }, async ({ idToken }, { session }) => {
  const res = await verifyAppleToken(idToken);
  const user = toSessionUser(res);
  writeSession(session, res, user);
  return { user, accountRestored: res.accountRestored === true };
});
