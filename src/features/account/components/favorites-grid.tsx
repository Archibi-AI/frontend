"use client";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { GalleryTile } from "@/features/ideabank";
import type { GalleryPostSimple } from "@/features/ideabank/schemas";
import { usePagedList } from "@/shared/http/paged-query";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Masonry } from "@/shared/ui/masonry";
import { MasonrySkeleton } from "@/shared/ui/skeleton";


/** Mirrors FavoriteIdeasScreen: favourited Idea Bank posts; empty copy from strings.xml (favorite_ideas_empty / _browse). */
export function FavoritesGrid() {
  const list = usePagedList<{ posts: GalleryPostSimple[] }, GalleryPostSimple>({ key: ["me", "favorites"], path: "/bff/ideabank/favorites", pick: (r) => r.posts });
  if (list.isPending) return <MasonrySkeleton />;
  if (list.isError) return <ErrorView error={list.error as AppError} onRetry={() => list.refetch()} />;
  if (list.items.length === 0)
    return (
      <EmptyState
        icon={<Bookmark className="size-10 text-subtle" aria-hidden />}
        title="No favorite ideas yet. Tap the bookmark on any idea in the Idea Bank to save it here."
        action={<Link href={routes.ideabank.index()} className="text-sm font-semibold text-brand hover:underline">Browse ideas</Link>}
      />
    );
  return (
    <>
      <Masonry
        items={list.items}
        getKey={(p) => p.uuid}
        render={(p) => <GalleryTile post={p} />}
      />
      <InfiniteSentinel hasMore={Boolean(list.hasNextPage)} loading={list.isFetchingNextPage} onLoadMore={() => list.fetchNextPage()} />
    </>
  );
}
