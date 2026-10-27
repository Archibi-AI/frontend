import { toggleFavorite } from "@/features/ideabank/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { AppError } from "@/shared/errors/app-error";

/** Toggle: adds the post to the caller's Favorite Ideas, or removes it (shared with the app). */
export const POST = bffHandler<unknown, { isFavorite: boolean }, { uuid: string }>({}, (_input, { params, session }) => {
  if (!/^\d{1,9}$/.test(params.uuid)) throw new AppError("NOT_FOUND", 404);
  return toggleFavorite(params.uuid, session);
});
