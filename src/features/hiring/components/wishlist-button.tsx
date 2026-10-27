"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useState } from "react";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/ui/toast";

/** Optimistic heart (H7). A signed-out click is sent to login by bffFetch and comes back here. */
export function WishlistButton({ uuid, initial, label = false }: { uuid: string; initial: boolean; label?: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [wished, setWished] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const before = wished;
    setWished(!before);
    setBusy(true);
    try {
      const res = await bffFetch<{ message: string; added: boolean }>(`/bff/hiring/professionals/${uuid}/wishlist`, { method: "POST" });
      setWished(res.added);
      toast({ kind: "success", title: res.message });
      void queryClient.invalidateQueries({ queryKey: ["hiring", "wishlist"] });
    } catch (err) {
      setWished(before);
      if (!(err instanceof AppError && err.code === "UNAUTHORIZED")) toast({ kind: "error", title: "Couldn't update your wishlist. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wished}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      disabled={busy}
      className={cn("inline-flex items-center gap-2 rounded-pill p-2 text-subtle transition-colors hover:text-brand", label && "border border-line px-4 text-sm font-medium")}
    >
      <Heart className={cn("size-5", wished && "fill-brand text-brand")} aria-hidden />
      {label && (wished ? "In your wishlist" : "Add to wishlist")}
    </button>
  );
}
