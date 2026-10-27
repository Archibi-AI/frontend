"use client";
import * as RAvatar from "@radix-ui/react-avatar";
import { cn } from "@/shared/lib/cn";

const initials = (name: string) => name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  return (
    <RAvatar.Root className={cn("inline-flex size-9 items-center justify-center overflow-hidden rounded-pill bg-brand-soft", className)}>
      {src ? <RAvatar.Image src={src} alt="" className="size-full object-cover" /> : null}
      <RAvatar.Fallback className="text-sm font-bold text-brand-strong">{initials(name) || "A"}</RAvatar.Fallback>
    </RAvatar.Root>
  );
}
