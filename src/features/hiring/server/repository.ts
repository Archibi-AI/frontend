import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import {
  CategoriesSchema,
  FiltersResponseSchema,
  HeaderSchema,
  ProfessionalsPageSchema,
  ProPageSchema,
  ProProjectsSchema,
  WishlistToggleSchema,
} from "../schemas";

// Function names equal the Ktor data-source methods (ProfessionalsKtorRemoteDataSource).

/** H1 */
export const getMainMenuHeader = () => djangoFetch({ method: "GET", path: "hiring/main-menu/header/", auth: "none", schema: HeaderSchema });

/** H2 — `type` is the lowercased tab. */
export const getMainMenuCategories = (type: string) =>
  djangoFetch({ method: "GET", path: "hiring/main-menu/categories/", query: { type }, auth: "none", schema: CategoriesSchema });

/** H3 — auth optional so `isWishedList` is right for a signed-in user. */
export const getCategoryProfessionals = (categoryUuid: string, page: number, filters: string | undefined, session?: SessionWriter) =>
  djangoFetch({
    method: "GET",
    path: "hiring/category/professional/",
    query: { category_uuid: categoryUuid, page, filters },
    auth: "optional",
    schema: ProfessionalsPageSchema,
    session,
  });

/** H4 */
export const getTagProfessionals = (tag: string, page: number, filters: string | undefined, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "hiring/tag/professional/", query: { tag, page, filters }, auth: "optional", schema: ProfessionalsPageSchema, session });

/** H5 — the id travels in the `pro-uuid` header (the view reads it); the app also sends the query. */
export const getProfessionalPage = (uuid: string, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "hiring/pro/page/", query: { pro_uuid: uuid }, headers: { "pro-uuid": uuid }, auth: "optional", schema: ProPageSchema, session });

/** H6 */
export const getProfessionalsProject = (page: number, uuid: string) =>
  djangoFetch({
    method: "GET",
    path: "hiring/pro/projects/",
    query: { page, professional_uuid: uuid },
    headers: { "professional-uuid": uuid },
    auth: "none",
    schema: ProProjectsSchema,
  });

/** H7 — toggles; the answer is the backend's message. */
export const wishlistCheck = (userUuid: string, professionalUuid: string, session?: SessionWriter) =>
  djangoFetch({
    method: "POST",
    path: "user/hiring/wishlist-check/",
    headers: { "user-uuid": userUuid, "professional-uuid": professionalUuid },
    auth: "required",
    schema: WishlistToggleSchema,
    session,
  });

/** H8 */
export const getWishlist = (page: number, session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "hiring/favorites/", query: { page }, auth: "required", schema: ProfessionalsPageSchema, session });

/** H9 */
export const getUserFilters = (scope: { category: string } | { tag: string }) =>
  djangoFetch({ method: "GET", path: "user/filters/", query: { section: "Hiring", ...scope }, auth: "none", schema: FiltersResponseSchema });
