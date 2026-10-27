import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import { MainMenuImagesSchema } from "../schemas";

/** I6 — AIGalleryKtorRemoteDataSource.getFavoritePosts (rendered on /account/favorite-ideas). */
export const getFavoritePosts = (page: number, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "ai/gallery/favorites/", query: { page }, auth: "required", schema: MainMenuImagesSchema, session });
