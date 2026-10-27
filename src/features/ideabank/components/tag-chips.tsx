"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { GalleryType } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { Chip } from "@/shared/ui/chip";
import { feedUrl, toggleTag } from "../model/gallery";
import type { GalleryTag } from "../schemas";

/** Multi-select tag chips; the selection lives in the URL (`?tags=12,15`) so a filtered feed is shareable. */
export function TagChips({ type, tags, selected }: { type: GalleryType; tags: readonly GalleryTag[]; selected: readonly string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (tags.length === 0) return null;
  const go = (ids: string[]) => start(() => router.replace(feedUrl(type, ids), { scroll: false }));
  return (
    <div role="group" aria-label="Filter by style" className={cn("-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0", pending && "opacity-60")}>
      {tags.map((t) => (
        <Chip key={t.id} selected={selected.includes(String(t.id))} onClick={() => go(toggleTag(selected, String(t.id)))}>
          {t.tag}
        </Chip>
      ))}
      {selected.length > 0 && (
        <Chip onClick={() => go([])} className="border-dashed text-brand">
          Clear
        </Chip>
      )}
    </div>
  );
}
