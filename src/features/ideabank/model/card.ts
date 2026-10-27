import type { GalleryPostSimple } from "../schemas";

/** Mirrors KMP GalleryImageSizing.kt: a stable, id-derived aspect ratio when the size is unknown, so the staggered feed never shifts. */
const MIN = 0.55;
const MAX = 1.8;
const BUCKETS = [0.62, 0.72, 0.84, 0.96, 1.12, 1.28, 1.46] as const;

const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

export const stableAspectRatioFromUuid = (uuid: number): number => clamp(BUCKETS[Math.abs(uuid) % BUCKETS.length] as number);

/** width / height of the tile (resolveGalleryCardAspectRatio). */
export function cardAspectRatio(post: Pick<GalleryPostSimple, "uuid" | "width" | "height" | "image_width" | "image_height">): number {
  const w = post.width ?? post.image_width;
  const h = post.height ?? post.image_height;
  if (!w || !h || w <= 0 || h <= 0) return stableAspectRatioFromUuid(post.uuid);
  return clamp(w / h);
}

/** The feed shows the light thumbnail when the backend has one, the full image otherwise. */
export const cardImage = (post: Pick<GalleryPostSimple, "image" | "thumbnail">): string => post.thumbnail || post.image;
