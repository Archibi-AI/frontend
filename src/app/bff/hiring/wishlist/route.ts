import { PageInputSchema } from "@/features/account/schemas";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getWishlist } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({ input: PageInputSchema }, async ({ page }, { session }) => {
  const res = await getWishlist(page, session);
  void rememberProfessionals(res.professionals);
  return res;
});
