import type { GalleryType } from "@/shared/config/routes";

export const GALLERY_TYPES: ReadonlyArray<{ value: GalleryType; label: string }> = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "landscape", label: "Landscape" },
];

/** The app's tabs (mainmenu/screen.kt:76-80); anything else falls back to the default tab "interior". */
export function parseGalleryType(value: string | null | undefined): GalleryType {
  const v = (value ?? "").toLowerCase();
  return GALLERY_TYPES.some((t) => t.value === v) ? (v as GalleryType) : "interior";
}

/** `tags=12,15` → ["12","15"]; non-numeric, empty and duplicate ids are dropped (the backend filters by tag pk). */
export function parseTagIds(value: string | null | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((s) => s.trim()).filter((s) => /^\d{1,9}$/.test(s)))];
}

export const tagsParam = (ids: readonly string[]) => ids.join(",");

export function toggleTag(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** `/ideabank?type=exterior&tags=12,15` — the shareable URL of a feed state. */
export function feedUrl(type: GalleryType, tagIds: readonly string[]): string {
  const q = new URLSearchParams({ type });
  if (tagIds.length) q.set("tags", tagsParam(tagIds));
  return `/ideabank?${q.toString()}`;
}

export const isPostId = (value: string) => /^\d{1,9}$/.test(value);
