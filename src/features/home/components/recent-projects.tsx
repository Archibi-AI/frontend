"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import type { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { RemoteImage } from "@/shared/ui/remote-image";
import { Skeleton } from "@/shared/ui/skeleton";
import type { RecentProjects as Data } from "../schemas";
import { ROW, ROW_ITEM_MD, SectionDivider, SectionTitle } from "./section-title";

const CARD = cn("aspect-[4/3] w-[140px] shrink-0 rounded-xl", ROW_ITEM_MD);

/** RecentProjectsSection.kt: the newest outputs (max 5), image only. Refreshed silently on every Home visit (D4). */
export function RecentProjects() {
  const query = useQuery<Data, AppError>({ queryKey: ["me", "recent-projects"], queryFn: () => bffFetch<Data>("/bff/home/recent-projects"), staleTime: 0, retry: false });
  const [zoomed, setZoomed] = useState<string>();
  const projects = query.data?.projects;

  return (
    <section aria-label="Your recent projects">
      <SectionDivider />
      <SectionTitle title="Your recent projects" actionLabel="View all" actionHref={routes.account.projects()} />
      {projects && projects.length === 0 && <p className="flex h-[105px] items-center justify-center text-sm text-subtle">No Project Created Yet</p>}
      {projects && projects.length > 0 && (
        <ul className={ROW}>
          {projects.map((p) => (
            <li key={`${p.type}-${p.uuid}`} className={cn(CARD, "overflow-hidden bg-track")}>
              <button type="button" onClick={() => setZoomed(p.generatedImage)} aria-label="Open recent project" className="block size-full">
                <RemoteImage src={p.generatedImage} alt="Recent project" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!projects && query.isPending && (
        <div className={ROW} role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => <Skeleton key={i} className={CARD} />)}
        </div>
      )}
      {!projects && query.isError && (
        <button type="button" onClick={() => query.refetch()} className="flex h-[105px] w-full flex-col items-center justify-center text-[13px]">
          <span className="text-subtle">Couldn&apos;t load this section.</span>
          <span className="font-semibold text-brand">Tap to retry</span>
        </button>
      )}
      <Dialog open={Boolean(zoomed)} onOpenChange={(open) => !open && setZoomed(undefined)}>
        <DialogContent size="lg">
          <DialogTitle className="sr-only">Recent project</DialogTitle>
          {zoomed && <RemoteImage src={zoomed} alt="Recent project" className="mx-auto max-h-[80vh] w-auto rounded-md object-contain" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
