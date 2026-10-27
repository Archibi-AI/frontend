"use client";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { usePagedList } from "@/shared/http/paged-query";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Masonry } from "@/shared/ui/masonry";
import { RemoteImage } from "@/shared/ui/remote-image";
import { MasonrySkeleton } from "@/shared/ui/skeleton";

interface FavoritePost { uuid: number; image: string; width?: number | null; height?: number | null }

/** Mirrors FavoriteIdeasScreen: favourited Idea Bank posts; empty copy from strings.xml (favorite_ideas_empty / _browse). */
export function FavoritesGrid() {
  const list = usePagedList<{ posts: FavoritePost[] }, FavoritePost>({ key: ["me", "favorites"], path: "/bff/ideabank/favorites", pick: (r) => r.posts });
  if (list.isPending) return <MasonrySkeleton />;
  if (list.isError) return <ErrorView error={list.error as AppError} onRetry={() => list.refetch()} />;
  if (list.items.length === 0)
    return (
      <EmptyState
        icon={<Bookmark className="size-10 text-subtle" aria-hidden />}
        title="You haven't saved any ideas yet."
        action={<Link href={routes.ideabank.index()} className="text-sm font-semibold text-brand hover:underline">Browse the Idea Bank</Link>}
      />
    );
  return (
    <>
      <Masonry
        items={list.items}
        getKey={(p) => p.uuid}
        render={(p) => (
          <Link href={routes.ideabank.post(p.uuid)} className="block overflow-hidden rounded-md bg-track">
            <RemoteImage src={p.image} alt="Saved design idea" width={p.width ?? undefined} height={p.height ?? undefined} className="h-auto w-full" />
          </Link>
        )}
      />
      <InfiniteSentinel hasMore={Boolean(list.hasNextPage)} loading={list.isFetchingNextPage} onLoadMore={() => list.fetchNextPage()} />
    </>
  );
}
