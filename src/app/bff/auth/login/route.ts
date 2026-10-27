import { toSessionUser, type AuthResult } from "@/features/auth/model/user";
import { LoginInputSchema } from "@/features/auth/schemas";
import { getUserDetails, logInUserToken } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { writeSession } from "@/server/session/cookies";

/** Mirrors LogInViewModel.logInApiService: A1, then A7 with the fresh token (userInformationApiService). */
export const POST = bffHandler<{ email: string; password: string }, AuthResult>({ input: LoginInputSchema }, async ({ email, password }, { session }) => {
  const login = await logInUserToken(email, password);
  const me = await getUserDetails(undefined, { access: login.access, userUuid: login.uuid });
  const user = toSessionUser(me, email);
  writeSession(session, login, user);
  return { user, accountRestored: login.accountRestored === true };
});
