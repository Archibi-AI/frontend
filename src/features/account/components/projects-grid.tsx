"use client";
import { Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { usePagedList } from "@/shared/http/paged-query";
import { routes } from "@/shared/config/routes";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Masonry } from "@/shared/ui/masonry";
import { ShareDialog } from "@/shared/share/share-dialog";
import { RemoteImage } from "@/shared/ui/remote-image";
import { MasonrySkeleton } from "@/shared/ui/skeleton";
import type { GeneratedImage } from "../schemas";

/** Mirrors MyProjectsGalleryScreen: the user's generated renders, newest first, 20 per page (type=all). */
export function ProjectsGrid() {
  const list = usePagedList<{ generatedImages: GeneratedImage[] }, GeneratedImage>({
    key: ["me", "projects"], path: "/bff/account/projects", pick: (r) => r.generatedImages,
  });
  const [open, setOpen] = useState<GeneratedImage>();
  const [sharing, setSharing] = useState(false);

  if (list.isPending) return <MasonrySkeleton />;
  if (list.isError) return <ErrorView error={list.error as AppError} onRetry={() => list.refetch()} />;
  if (list.items.length === 0)
    return (
      <EmptyState
        icon={<Sparkles className="size-10 text-subtle" aria-hidden />}
        title="No projects yet"
        action={<Link href={routes.ai.index()} className={buttonVariants({ size: "sm" })}>Start designing</Link>}
      />
    );
  return (
    <>
      <Masonry
        items={list.items}
        getKey={(p) => p.uuid}
        render={(p) => (
          <button type="button" onClick={() => setOpen(p)} className="block w-full overflow-hidden rounded-md bg-track" aria-label={`Open project ${p.uuid}`}>
            <RemoteImage src={p.generatedImage} alt="AI generated design" className="w-full" />
          </button>
        )}
      />
      <InfiniteSentinel hasMore={Boolean(list.hasNextPage)} loading={list.isFetchingNextPage} onLoadMore={() => list.fetchNextPage()} />
      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(undefined)}>
        <DialogContent size="lg">
          <DialogTitle className="sr-only">Project</DialogTitle>
          {open && (
            <div className="space-y-4">
              <RemoteImage src={open.generatedImage} alt="AI generated design" className="mx-auto max-h-[70vh] w-auto rounded-md object-contain" />
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => setSharing(true)}>
                  <Share2 className="size-4" aria-hidden /> Share
                </Button>
                <a href={open.generatedImage} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>Open full size</a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {open && <ShareDialog open={sharing} onOpenChange={setSharing} title="My Archibi design" url={open.generatedImage} text="Look at the design I created with Archibi AI" imageUrl={open.generatedImage} />}
      {list.isFetchingNextPage && <p className="py-6 text-center text-sm text-subtle">Loading…</p>}
      {!list.hasNextPage && list.items.length > 20 && <div className="py-6 text-center"><Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top</Button></div>}
    </>
  );
}
