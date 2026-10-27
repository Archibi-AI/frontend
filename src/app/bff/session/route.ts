import { z } from "zod";
import { bootSession } from "@/features/auth/server/bootstrap";
import { bffHandler } from "@/server/bff/handler";
import { ensureFreshAccess } from "@/server/session/refresh";

export type SessionResponse =
  | { authenticated: false; reason?: "account_removed" }
  | { authenticated: true; user: { uuid: string; username: string; email: string; imageUri: string } };

const Query = z.object({ boot: z.enum(["1"]).optional() });

/** GET /bff/session — UI session state; may silently refresh (F06). `?boot=1` = once-per-browser-session validation. Never returns tokens. */
export const GET = bffHandler<z.infer<typeof Query>, SessionResponse>({ input: Query }, async ({ boot }, { session }) => {
  const fresh = await ensureFreshAccess(session);
  if (!fresh) return { authenticated: false };
  if (boot) {
    const result = await bootSession(fresh.user, session);
    if (result.kind === "removed") return { authenticated: false, reason: "account_removed" };
    return { authenticated: true, user: result.user };
  }
  return { authenticated: true, user: fresh.user };
});
