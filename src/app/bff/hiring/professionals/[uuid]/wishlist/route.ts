import { isUuid } from "@/features/hiring/model/types";
import { wishlistCheck } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { getSessionTokens } from "@/server/session/cookies";
import { AppError } from "@/shared/errors/app-error";

/** Toggle: adds the professional to the caller's wishlist, or removes it (shared with the app). The message is the backend's. */
export const POST = bffHandler<unknown, { message: string; added: boolean }, { uuid: string }>({}, async (_input, { params, session }) => {
  if (!isUuid(params.uuid)) throw new AppError("NOT_FOUND", 404);
  const { user } = await getSessionTokens();
  if (!user) throw new AppError("UNAUTHORIZED", 401);
  const res = await wishlistCheck(user.uuid, params.uuid, session);
  return { message: res.message, added: /added to your wishlist/i.test(res.message) };
});
