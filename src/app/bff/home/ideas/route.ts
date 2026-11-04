import { getHomepageIdeas } from "@/features/home/server/repository";
import { rememberItems } from "@/features/ideabank/server/item-cache";
import { bffHandler } from "@/server/bff/handler";

/** The post endpoint has no image (D21), so remember it here before a card can be opened. */
export const GET = bffHandler({}, async (_input, { session }) => {
  const res = await getHomepageIdeas(session);
  await rememberItems(res.ideas);
  return res;
});
