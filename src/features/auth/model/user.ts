import type { SessionUser } from "@/server/session/sign";

/** Normalises the different user shapes the auth endpoints return into the session user (`ab_u`). */
export function toSessionUser(input: { uuid: string; username?: string | null; email?: string | null; imageUri?: string | null }, fallbackEmail = ""): SessionUser {
  const email = input.email ?? fallbackEmail;
  return { uuid: input.uuid, username: input.username ?? email, email, imageUri: input.imageUri ?? "" };
}

export interface AuthResult {
  user: SessionUser;
  accountRestored: boolean;
}
