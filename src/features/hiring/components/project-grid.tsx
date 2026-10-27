"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { bffFetch } from "@/shared/http/bff-fetch";
import { fetchPage, nextPageParam } from "@/shared/lib/paging";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { RemoteImage } from "@/shared/ui/remote-image";
import type { ProProject } from "../schemas";

/** All projects of a professional, 20 per page; page 1 server-rendered. */
export function ProjectGrid({ uuid, initial }: { uuid: string; initial: ProProject[] }) {
  const q = useInfiniteQuery({
    queryKey: ["hiring", "projects", uuid],
    initialPageParam: 1,
    initialData: { pages: [initial], pageParams: [1] },
    staleTime: 60_000,
    queryFn: ({ pageParam }) => fetchPage(async () => (await bffFetch<{ projects: ProProject[] }>(`/bff/hiring/professionals/${uuid}/projects`, { query: { page: pageParam } })).projects),
    getNextPageParam: (last, all) => nextPageParam(last, all),
  });
  const items = q.data.pages.flat();
  if (q.isError && items.length === 0) return <ErrorView error={q.error as AppError} onRetry={() => q.refetch()} />;
  if (items.length === 0) return <EmptyState icon={<Images className="size-10 text-subtle" aria-hidden />} title="No projects yet." />;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.uuid}>
            <ProjectTile project={p} />
          </li>
        ))}
      </ul>
      <InfiniteSentinel hasMore={Boolean(q.hasNextPage)} loading={q.isFetchingNextPage} onLoadMore={() => q.fetchNextPage()} />
      {q.isError && <ErrorView error={q.error as AppError} onRetry={() => q.fetchNextPage()} />}
    </>
  );
}

export function ProjectTile({ project }: { project: Pick<ProProject, "image" | "title" | "location"> }) {
  return (
    <figure className="overflow-hidden border border-line bg-surface">
      <div className="aspect-[4/3] bg-track">{project.image && <RemoteImage src={project.image} alt={project.title} className="size-full object-cover" />}</div>
      <figcaption className="px-3 py-2">
        <p className="truncate text-sm font-medium text-ink-2">{project.title || "Project"}</p>
        {project.location && <p className="truncate text-xs text-subtle">{project.location}</p>}
      </figcaption>
    </figure>
  );
}
