"use client";
import { Copy, Download, Send } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { downloadName, linkedinUrl, pinterestUrl, telegramUrl, twitterUrl, type ShareTarget } from "./share-links";

export interface ShareDialogProps extends ShareTarget {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Picture to offer as a download (and to pin). Omit for pages without one. */
  imageUrl?: string;
}

const Glyph = ({ children, className }: { children: ReactNode; className: string }) => (
  <span aria-hidden className={cn("flex size-12 items-center justify-center rounded-pill text-lg font-bold text-white", className)}>{children}</span>
);

/** Share sheet used everywhere something can be shared: X, LinkedIn, Pinterest, Telegram, Download, Copy link. */
export function ShareDialog({ open, onOpenChange, title = "Share", url, text, imageUrl }: ShareDialogProps) {
  const toast = useToast();
  const target: ShareTarget = { url, text, imageUrl };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({ kind: "success", title: "Link copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy the link." });
    }
  }

  /** Cross-origin images can't use <a download>; fetch the bytes when the host allows it, else open the picture in a tab. */
  async function download() {
    if (!imageUrl) return;
    const name = downloadName(title, imageUrl);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(String(res.status));
      const href = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  }

  const links: Array<{ label: string; href: string; glyph: ReactNode; color: string }> = [
    { label: "X (Twitter)", href: twitterUrl(target), glyph: "𝕏", color: "bg-black" },
    { label: "LinkedIn", href: linkedinUrl(target), glyph: "in", color: "bg-[#0a66c2]" },
    { label: "Pinterest", href: pinterestUrl(target), glyph: "P", color: "bg-[#e60023]" },
    { label: "Telegram", href: telegramUrl(target), glyph: <Send className="size-5" />, color: "bg-[#229ed9]" },
  ];
  const item = "flex flex-col items-center gap-2 text-sm text-ink-3 hover:text-ink-2";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>Share</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-subtle">Share this with your friends or save it.</DialogDescription>
        <ul className="mt-5 grid grid-cols-3 gap-y-5">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className={item}>
                <Glyph className={l.color}>{l.glyph}</Glyph>
                {l.label}
              </a>
            </li>
          ))}
          {imageUrl && (
            <li>
              <button type="button" onClick={download} className={item}>
                <Glyph className="bg-ink-2"><Download className="size-5" /></Glyph>
                Download
              </button>
            </li>
          )}
          <li>
            <button type="button" onClick={copy} className={item}>
              <Glyph className="bg-brand"><Copy className="size-5" /></Glyph>
              Copy link
            </button>
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
