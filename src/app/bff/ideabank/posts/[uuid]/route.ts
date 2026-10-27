import { loadPost } from "@/features/ideabank/server/post";
import { bffHandler } from "@/server/bff/handler";
import { AppError } from "@/shared/errors/app-error";

/** Post data for the modal. Auth optional (a signed-in user gets the right isFavorite). */
export const GET = bffHandler<unknown, Awaited<ReturnType<typeof loadPost>>, { uuid: string }>({}, (_input, { params, session }) => {
  if (!/^\d{1,9}$/.test(params.uuid)) throw new AppError("NOT_FOUND", 404);
  return loadPost(Number(params.uuid), session);
});
