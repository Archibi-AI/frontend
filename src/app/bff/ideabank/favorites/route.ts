import { PageInputSchema } from "@/features/account/schemas";
import { rememberItems } from "@/features/ideabank/server/item-cache";
import { getFavoritePosts } from "@/features/ideabank/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({ input: PageInputSchema }, async ({ page }, { session }) => {
  const res = await getFavoritePosts(page, session);
  void rememberItems(res.posts);
  return res;
});
