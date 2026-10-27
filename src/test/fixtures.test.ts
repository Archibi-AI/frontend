// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { PairSchema } from "@/server/session/refresh";
import refresh from "./fixtures/foundation/token-refresh.json";
import anonymous from "./fixtures/foundation/session-anonymous.json";
import signedIn from "./fixtures/foundation/session-user.json";

const Session = z.discriminatedUnion("authenticated", [
  z.object({ authenticated: z.literal(false) }),
  z.object({ authenticated: z.literal(true), user: z.object({ uuid: z.string(), username: z.string(), email: z.string(), imageUri: z.string() }) }),
]);

/** Every fixture must parse with its contract schema (architecture/10 §6). Sections add rows. */
describe("fixtures match their schemas (F11)", () => {
  it("token-refresh.json ↔ foundation/api/token-refresh.md", () => expect(PairSchema.parse(refresh)).toBeTruthy());
  it("session fixtures ↔ foundation/api/session.md", () => {
    expect(Session.parse(anonymous)).toEqual({ authenticated: false });
    expect(Session.parse(signedIn).authenticated).toBe(true);
  });
  it("a missing required field is rejected", () => {
    const broken: Partial<typeof refresh> = { ...refresh };
    delete broken.refresh;
    expect(PairSchema.safeParse(broken).success).toBe(false);
  });
});
