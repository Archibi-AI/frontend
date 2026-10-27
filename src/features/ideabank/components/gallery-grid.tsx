"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { routes, type GalleryType } from "@/shared/config/routes";
import { bffFetch } from "@/shared/http/bff-fetch";
import { fetchPage, nextPageParam } from "@/shared/lib/paging";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Masonry } from "@/shared/ui/masonry";
import { RemoteImage } from "@/shared/ui/remote-image";
import { MasonrySkeleton } from "@/shared/ui/skeleton";
import { cardAspectRatio, cardImage } from "../model/card";
import { tagsParam } from "../model/gallery";
import type { GalleryPostSimple } from "../schemas";

/**
 * Infinite masonry of Idea Bank posts (24 per page). Page 1 arrives server-rendered (`initial`);
 * the rest loads through /bff/ideabank/posts. Mirrors AIGalleryMainMenuViewModel.pagingApi:
 * selected tags → tags/posts, otherwise main-menu/posts for the tab's type.
 */
export function GalleryGrid({ type, tags, initial }: { type: GalleryType; tags: readonly string[]; initial: GalleryPostSimple[] }) {
  const tagKey = tagsParam(tags);
  const query = useInfiniteQuery({
    queryKey: ["ideabank", "posts", type, tagKey],
    initialPageParam: 1,
    initialData: { pages: [initial], pageParams: [1] },
    staleTime: 60_000,
    queryFn: ({ pageParam }) =>
      fetchPage(async () => (await bffFetch<{ posts: GalleryPostSimple[] }>("/bff/ideabank/posts", { query: { type, tags: tagKey || undefined, page: pageParam } })).posts),
    getNextPageParam: (last, all) => nextPageParam(last, all),
  });
  const items = query.data.pages.flat();

  if (query.isError && items.length === 0) return <ErrorView error={query.error as AppError} onRetry={() => query.refetch()} />;
  if (items.length === 0 && !query.isFetching) {
    return <EmptyState icon={<Lightbulb className="size-10 text-subtle" aria-hidden />} title="No ideas here yet." />;
  }
  return (
    <>
      <Masonry
        items={items}
        getKey={(p) => p.uuid}
        render={(p) => <GalleryTile post={p} />}
      />
      {query.isFetchingNextPage && <MasonrySkeleton count={4} />}
      <InfiniteSentinel hasMore={Boolean(query.hasNextPage)} loading={query.isFetchingNextPage} onLoadMore={() => query.fetchNextPage()} />
      {query.isError && <ErrorView error={query.error as AppError} onRetry={() => query.fetchNextPage()} />}
    </>
  );
}

/** The aspect ratio is reserved up front (stable per post, like the app) so loading images never move the layout. */
export function GalleryTile({ post }: { post: GalleryPostSimple }) {
  return (
    <Link
      href={routes.ideabank.post(post.uuid)}
      scroll={false}
      aria-label={`Open idea ${post.uuid}`}
      style={{ aspectRatio: cardAspectRatio(post) }}
      className="group block overflow-hidden rounded-md bg-track"
    >
      <RemoteImage
        src={cardImage(post)}
        alt="Design idea"
        className="size-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.03]"
      />
    </Link>
  );
}
