import "server-only";
import { AppError } from "@/shared/errors/app-error";
import { clearSession, getSessionTokens, writeUser, type SessionWriter } from "@/server/session/cookies";
import { jwtExpMs } from "@/server/session/jwt";
import type { SessionUser } from "@/server/session/sign";
import { toSessionUser } from "../model/user";
import { checkUserValidation, getUserDetails, logOutUser } from "./repository";

export type BootResult = { kind: "ok"; user: SessionUser } | { kind: "removed" };

async function endSession(session: SessionWriter): Promise<void> {
  const { refresh } = await getSessionTokens();
  if (refresh) await logOutUser(refresh).catch(() => undefined);
  clearSession(session);
}

/**
 * Mirrors the app's InitialLoaderScreen: once per browser session, validate the account (A8) and refresh
 * the user (A7). A removed/deleted account signs out; any transient failure keeps the session.
 */
export async function bootSession(user: SessionUser, session: SessionWriter): Promise<BootResult> {
  try {
    const validation = await checkUserValidation(user.username, session);
    if (validation.hasDeletedAccount) {
      await endSession(session);
      return { kind: "removed" };
    }
    const me = await getUserDetails(session);
    const fresh = toSessionUser(me);
    const { refresh } = await getSessionTokens();
    if (refresh) writeUser(session, fresh, jwtExpMs(refresh));
    return { kind: "ok", user: fresh };
  } catch (e) {
    if (e instanceof AppError && e.code === "USER_NOT_EXIST") {
      await endSession(session);
      return { kind: "removed" };
    }
    return { kind: "ok", user }; // never log out on a transient error (network, 5xx)
  }
}
