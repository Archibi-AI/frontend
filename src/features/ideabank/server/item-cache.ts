import "server-only";
import { z } from "zod";
import { redis } from "@/server/redis";
import type { GalleryPostSimple } from "../schemas";

/**
 * The post page endpoint does not return the image (the app already has it from the list item).
 * The feed BFF remembers each item for a week so a direct /ideabank/post/<id> load can show it (D21).
 */
const TTL_SECONDS = 7 * 24 * 3600;
const key = (uuid: number | string) => `ab:gallery:item:${uuid}`;
const CachedItem = z.object({ image: z.string(), width: z.number().int().nullable(), height: z.number().int().nullable() });
export type CachedItem = z.infer<typeof CachedItem>;

/** Best effort: a Redis hiccup must never break a feed response. */
export async function rememberItems(items: readonly GalleryPostSimple[]): Promise<void> {
  if (items.length === 0) return;
  try {
    const pipeline = redis().pipeline();
    for (const i of items) pipeline.set(key(i.uuid), JSON.stringify({ image: i.image, width: i.width ?? null, height: i.height ?? null }), "EX", TTL_SECONDS);
    await pipeline.exec();
  } catch {
    /* cache only */
  }
}

export async function recallItem(uuid: number | string): Promise<CachedItem | null> {
  try {
    const raw = await redis().get(key(uuid));
    if (!raw) return null;
    const parsed = CachedItem.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
