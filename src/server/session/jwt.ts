/** Reads `exp` (ms epoch) from a JWT without verifying it — Django verifies; we only schedule refreshes. */
export function jwtExpMs(jwt: string | undefined | null): number {
  if (!jwt) return 0;
  try {
    const part = jwt.split(".")[1];
    if (!part) return 0;
    const exp = (JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}
