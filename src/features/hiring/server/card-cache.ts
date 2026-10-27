import "server-only";
import { redis } from "@/server/redis";
import { ProfessionalSimpleSchema, type ProfessionalSimple } from "../schemas";

/**
 * The pro page endpoint does not return the card (name, avatar…) — the app passes it through its route JSON.
 * Every list BFF remembers the cards for a week so a direct /hiring/professional/<uuid> load can show them (D21).
 */
const TTL_SECONDS = 7 * 24 * 3600;
const key = (uuid: string) => `ab:hiring:pro:${uuid}`;

export async function rememberProfessionals(items: readonly ProfessionalSimple[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const pipeline = redis().pipeline();
    for (const p of items) pipeline.set(key(p.uuid), JSON.stringify(p), "EX", TTL_SECONDS);
    await pipeline.exec();
  } catch {
    /* cache only */
  }
}

export async function recallProfessional(uuid: string): Promise<ProfessionalSimple | null> {
  try {
    const raw = await redis().get(key(uuid));
    if (!raw) return null;
    const parsed = ProfessionalSimpleSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
