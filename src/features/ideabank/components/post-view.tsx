"use client";
import { ExternalLink, Share2 } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { buttonVariants, Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { RemoteImage } from "@/shared/ui/remote-image";
import { useToast } from "@/shared/ui/toast";
import type { PostView as PostData } from "../schemas";
import { FavoriteButton } from "./favorite-button";

/** One idea: image, style tags (→ tag pages), favorite, share. Used by the page and the modal. The app's Play Store link is not shown on the web. */
export function PostView({ post, layout = "page" }: { post: PostData; layout?: "page" | "modal" }) {
  const toast = useToast();
  async function share() {
    const url = `${window.location.origin}${routes.ideabank.post(post.uuid)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Archibi design idea", url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ kind: "info", title: "Link copied" });
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  return (
    <div className={layout === "modal" ? "grid gap-6 md:grid-cols-[1fr_280px]" : "grid gap-8 lg:grid-cols-[1fr_320px]"}>
      <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-md bg-night">
        {post.item ? (
          <RemoteImage
            src={post.item.image}
            alt="Design idea"
            width={post.item.width ?? undefined}
            height={post.item.height ?? undefined}
            className="max-h-[75vh] w-auto max-w-full object-contain"
          />
        ) : (
          <p className="p-8 text-center text-sm text-night-muted">This idea&apos;s picture isn&apos;t available here. Open it from the Idea Bank feed.</p>
        )}
      </div>
      <aside className="space-y-6">
        {post.tags.length > 0 && (
          <section aria-label="Style tags">
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[.08em] text-ink-2">Style</h2>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link key={t.id} href={routes.ideabank.tag(t.tag, t.id)}>
                  <Chip tabIndex={-1} className="pointer-events-none">{t.tag}</Chip>
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-wrap gap-3">
          <FavoriteButton uuid={post.uuid} initial={post.isFavorite} />
          <Button variant="secondary" size="sm" onClick={share}>
            <Share2 className="size-4" aria-hidden /> Share
          </Button>
          {post.item && (
            <a href={post.item.image} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ExternalLink className="size-4" aria-hidden /> Open full size
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
