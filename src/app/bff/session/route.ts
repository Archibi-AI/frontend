import { bffHandler } from "@/server/bff/handler";
import { ensureFreshAccess } from "@/server/session/refresh";

export type SessionResponse =
  | { authenticated: false }
  | { authenticated: true; user: { uuid: string; username: string; email: string; imageUri: string } };

/** GET /bff/session — UI session state; may silently refresh (F06). Never returns tokens. */
export const GET = bffHandler<unknown, SessionResponse>({}, async (_input, { session }) => {
  const fresh = await ensureFreshAccess(session);
  return fresh ? { authenticated: true, user: fresh.user } : { authenticated: false };
});
