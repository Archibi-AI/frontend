/** In-memory stand-ins for next/headers cookies()/headers(), shared by server unit tests. */
export const jar = new Map<string, { value: string; opts?: object }>();
export const incoming = new Headers();

export const cookieStore = {
  get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
  set: (name: string, value: string, opts?: object) => void jar.set(name, { value, opts }),
  delete: (name: string) => void jar.delete(name),
};

export function resetNextHeaders(): void {
  jar.clear();
  for (const key of [...incoming.keys()]) incoming.delete(key);
}

/** A syntactically valid unsigned JWT with the given exp (seconds). Django verifies real ones; the BFF only reads exp. */
export function fakeJwt(expSeconds: number, extra: Record<string, unknown> = {}): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ exp: expSeconds, ...extra })}.sig`;
}
