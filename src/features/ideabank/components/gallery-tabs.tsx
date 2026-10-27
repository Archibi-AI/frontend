"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { GalleryType } from "@/shared/config/routes";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { feedUrl, GALLERY_TYPES } from "../model/gallery";

/** Interior · Exterior · Landscape (mainmenu/screen.kt:76-80). Changing the tab clears the tag selection, like the app. */
export function GalleryTabs({ type }: { type: GalleryType }) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <Tabs value={type} onValueChange={(v) => start(() => router.replace(feedUrl(v as GalleryType, []), { scroll: false }))} className="mb-5">
      <TabsList label="Idea type">
        {GALLERY_TYPES.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
