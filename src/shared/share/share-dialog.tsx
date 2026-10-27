"use client";
import { Check, Copy, Download } from "lucide-react";
import { useState, type ComponentType } from "react";
import { FaFacebook, FaLinkedinIn, FaPinterest, FaTelegram, FaXTwitter } from "react-icons/fa6";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { downloadName, facebookUrl, linkedinUrl, pinterestUrl, telegramUrl, twitterUrl, type ShareTarget } from "./share-links";

export interface ShareDialogProps extends ShareTarget {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Picture to offer as a download (and to pin). Omit for pages without one. */
  imageUrl?: string;
}

interface Network { label: string; href: (t: ShareTarget) => string; Icon: ComponentType<{ className?: string }>; tile: string; round: boolean }
/** `round` logos (Facebook, Pinterest, Telegram) are already a coloured disc; X and LinkedIn sit on one. */
const NETWORKS: Network[] = [
  { label: "X", href: twitterUrl, Icon: FaXTwitter, tile: "bg-black text-white", round: false },
  { label: "Facebook", href: facebookUrl, Icon: FaFacebook, tile: "text-[#1877f2]", round: true },
  { label: "LinkedIn", href: linkedinUrl, Icon: FaLinkedinIn, tile: "bg-[#0a66c2] text-white", round: false },
  { label: "Pinterest", href: pinterestUrl, Icon: FaPinterest, tile: "text-[#e60023]", round: true },
  { label: "Telegram", href: telegramUrl, Icon: FaTelegram, tile: "text-[#26a5e4]", round: true },
];

const tileClass = "flex size-14 items-center justify-center rounded-pill transition-transform group-hover:scale-105";

/** Share sheet used everywhere something can be shared: five networks in one aligned row, then Download and Copy link. */
export function ShareDialog({ open, onOpenChange, title = "Share", url, text, imageUrl }: ShareDialogProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const target: ShareTarget = { url, text, imageUrl };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ kind: "success", title: "Link copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy the link." });
    }
  }

  /** Saves immediately: same-origin images directly, everything else through the /bff/download proxy. */
  async function download() {
    if (!imageUrl || downloading) return;
    setDownloading(true);
    const name = downloadName(title, imageUrl);
    try {
      const sameOrigin = new URL(imageUrl, window.location.href).origin === window.location.origin;
      const source = sameOrigin ? imageUrl : `/bff/download?${new URLSearchParams({ url: imageUrl, name: title })}`;
      const res = await fetch(source);
      if (!res.ok) throw new Error(String(res.status));
      const saved = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1];
      const href = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = href;
      a.download = saved ?? name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10_000);
    } catch {
      toast({ kind: "error", title: "Couldn't download the image. Please try again." });
    } finally {
      setDownloading(false);
    }
  }

  const action = "flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-line text-sm font-medium text-ink-2 transition-colors hover:border-line-strong hover:bg-track disabled:opacity-60";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogTitle>Share</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-subtle">Share this with your friends or save it.</DialogDescription>
        <ul className="mt-6 grid grid-cols-5 gap-2">
          {NETWORKS.map(({ label, href, Icon, tile, round }) => (
            <li key={label}>
              <a href={href(target)} target="_blank" rel="noopener noreferrer" aria-label={label} className="group flex flex-col items-center gap-2 text-xs font-medium text-ink-3 hover:text-ink-2">
                <span aria-hidden className={cn(tileClass, tile)}>
                  <Icon className={round ? "size-14" : "size-6"} />
                </span>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3 border-t border-line pt-5">
          {imageUrl && (
            <button type="button" onClick={download} disabled={downloading} className={action}>
              <Download className="size-4" aria-hidden /> {downloading ? "Saving…" : "Download"}
            </button>
          )}
          <button type="button" onClick={copy} className={action}>
            {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />} Copy link
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
