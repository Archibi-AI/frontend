import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { env } from "@/server/env";

export const SessionUserSchema = z.object({
  uuid: z.string(),
  username: z.string(),
  email: z.string(),
  imageUri: z.string(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");
const mac = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest();

/** `ab_u` cookie value: base64url(JSON).base64url(HMAC-SHA256). Never trusted for authorization (Django is). */
export function signUser(user: SessionUser, secret = env().BFF_COOKIE_SECRET): string {
  const payload = b64(JSON.stringify(user));
  return `${payload}.${b64(mac(payload, secret))}`;
}

export function verifyUser(value: string | undefined | null, secret = env().BFF_COOKIE_SECRET): SessionUser | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = mac(payload, secret);
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const parsed = SessionUserSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
