import { logOutUser } from "@/features/auth/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { clearSession, getSessionTokens } from "@/server/session/cookies";

/** Signs out the website only: blacklists the web refresh token; the app token is never touched (D8). */
export const POST = bffHandler<unknown, null>({}, async (_input, { session }) => {
  const { refresh } = await getSessionTokens();
  if (refresh) await logOutUser(refresh).catch(() => undefined); // best effort — cookies are cleared regardless
  clearSession(session);
  return null;
});
