import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import type { GalleryType } from "@/shared/config/routes";
import { FavoriteToggleSchema, MainMenuImagesSchema, MainMenuTagsSchema, PostPageSchema } from "../schemas";

// Function names equal the Ktor data-source methods (AIGalleryKtorRemoteDataSource).

/** I1 */
export const getMainMenuTags = (type: GalleryType) =>
  djangoFetch({ method: "GET", path: "ai/gallery/main-menu/tags/", query: { type }, auth: "none", schema: MainMenuTagsSchema });

/** I2 */
export const getMainMenuPosts = (type: GalleryType, page: number) =>
  djangoFetch({ method: "GET", path: "ai/gallery/main-menu/posts/", query: { type, page }, auth: "none", schema: MainMenuImagesSchema });

/** I3 — `ids` is the comma-joined selected tag ids (AIGalleryMainMenuViewModel.pagingApi). */
export const getTagPosts = (ids: string, page: number) =>
  djangoFetch({ method: "GET", path: "ai/gallery/tags/posts/", query: { id: ids, page }, auth: "none", schema: MainMenuImagesSchema });

/** I4 — auth optional: a signed-in user gets the right `isFavorite`. */
export const getPostPage = (postUuid: number | string, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "ai/gallery/post/", query: { project_uuid: postUuid }, auth: "optional", schema: PostPageSchema, session });

/** I5 — the post id travels in the `project-uuid` header, exactly like the app. */
export const toggleFavorite = (postUuid: number | string, session?: SessionWriter) =>
  djangoFetch({ method: "POST", path: "ai/gallery/post/favorite/", headers: { "project-uuid": String(postUuid) }, auth: "required", schema: FavoriteToggleSchema, session });

export { getFavoritePosts } from "./favorites";
