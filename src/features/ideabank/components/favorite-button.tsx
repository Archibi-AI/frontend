"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useState } from "react";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/toast";

export const FAVORITE_TEXT = { add: "Add to favorites", remove: "Remove from favorites", saved: "Saved to Favorite Ideas", failed: "Couldn't update your favorites. Please try again." } as const; // KMP strings.xml

/** Optimistic bookmark (posts/screen.kt:222-232). A signed-out click sends the user to login and back to this post. */
export function FavoriteButton({ uuid, initial }: { uuid: number; initial: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [favorite, setFavorite] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const before = favorite;
    setFavorite(!before); // optimistic
    setBusy(true);
    try {
      const res = await bffFetch<{ isFavorite: boolean }>(`/bff/ideabank/posts/${uuid}/favorite`, { method: "POST" });
      setFavorite(res.isFavorite);
      if (res.isFavorite) toast({ kind: "success", title: FAVORITE_TEXT.saved });
      void queryClient.invalidateQueries({ queryKey: ["me", "favorites"] });
      void queryClient.invalidateQueries({ queryKey: ["ideabank", "post", uuid] });
    } catch (e) {
      setFavorite(before); // roll back
      if (!(e instanceof AppError && e.code === "UNAUTHORIZED")) toast({ kind: "error", title: FAVORITE_TEXT.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle} aria-pressed={favorite} disabled={busy}>
      <Bookmark className={cn("size-4", favorite && "fill-brand text-brand")} aria-hidden />
      {favorite ? FAVORITE_TEXT.remove : FAVORITE_TEXT.add}
    </Button>
  );
}
