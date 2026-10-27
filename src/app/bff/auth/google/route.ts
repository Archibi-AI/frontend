import { toSessionUser, type AuthResult } from "@/features/auth/model/user";
import { GoogleInputSchema } from "@/features/auth/schemas";
import { verifyGoogleToken } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { writeSession } from "@/server/session/cookies";

/** Mirrors GoogleAuthViewModel (A5): Google Identity Services `credential` is the id_token. */
export const POST = bffHandler<{ credential: string }, AuthResult>({ input: GoogleInputSchema }, async ({ credential }, { session }) => {
  const res = await verifyGoogleToken(credential);
  const user = toSessionUser(res);
  writeSession(session, res, user);
  return { user, accountRestored: res.accountRestored === true };
});
