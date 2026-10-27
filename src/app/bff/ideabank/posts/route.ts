import { z } from "zod";
import { rememberItems } from "@/features/ideabank/server/item-cache";
import { getMainMenuPosts, getTagPosts } from "@/features/ideabank/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({
  type: z.enum(["interior", "exterior", "landscape"]).default("interior"),
  tags: z.string().regex(/^\d{1,9}(,\d{1,9})*$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

/** Feed page: tags selected → I3 (tags/posts), otherwise I2 (main-menu/posts) — AIGalleryMainMenuViewModel.pagingApi. */
export const GET = bffHandler({ input: Query }, async ({ type, tags, page }) => {
  const res = tags ? await getTagPosts(tags, page) : await getMainMenuPosts(type, page);
  void rememberItems(res.posts);
  return res;
});
