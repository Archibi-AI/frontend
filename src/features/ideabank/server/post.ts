import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { SessionWriter } from "@/server/session/cookies";
import { AppError } from "@/shared/errors/app-error";
import type { PostView } from "../schemas";
import { recallItem } from "./item-cache";
import { getPostPage } from "./repository";

/** Post page data (I4) + the remembered image — shared by the post page and the modal's BFF route. */
export async function loadPost(uuid: number, session?: SessionWriter): Promise<PostView> {
  const [page, item] = await Promise.all([getPostPage(uuid, session), recallItem(uuid)]);
  return { uuid, tags: page.tags, isFavorite: page.isFavorite, likeCount: page.likeStatus?.count ?? 0, item };
}

/** For pages: Django answers 400 "this post does not exist!" for an unknown id → a real 404 page. Deduped per request. */
export const loadPostOrNotFound = cache(async (uuid: number): Promise<PostView> => {
  try {
    return await loadPost(uuid);
  } catch (e) {
    if (e instanceof AppError && (e.code === "NOT_FOUND" || /does not exist/i.test(e.message))) notFound();
    throw e;
  }
});
