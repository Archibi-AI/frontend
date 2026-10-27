"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import type { PostView as PostData } from "../schemas";
import { PostView } from "./post-view";

/** The Idea Bank post popup (GalleryPostDialog.kt): an intercepted route over the feed; Esc / ✕ goes back to it. */
export function PostModal({ uuid }: { uuid: number }) {
  const router = useRouter();
  const query = useQuery({ queryKey: ["ideabank", "post", uuid], queryFn: () => bffFetch<PostData>(`/bff/ideabank/posts/${uuid}`), staleTime: 30_000 });
  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent size="full">
        <DialogTitle className="sr-only">Design idea</DialogTitle>
        <DialogDescription className="sr-only">Style tags, favorite and share actions for this idea.</DialogDescription>
        {query.isPending && <Skeleton className="h-[60vh] w-full" />}
        {query.isError && <ErrorView error={query.error as AppError} onRetry={() => query.refetch()} />}
        {query.data && <PostView post={query.data} layout="modal" />}
      </DialogContent>
    </Dialog>
  );
}
