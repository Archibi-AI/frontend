import { z } from "zod";

/** frontend/ideabank/api/main-menu-posts.md (KMP GalleryPostSimpleDC / MainMenuImagesResponse) */
export const GalleryPostSimpleSchema = z.object({
  uuid: z.number().int(),
  image: z.string(),
  width: z.number().int().nullish(),
  height: z.number().int().nullish(),
});
export const MainMenuImagesSchema = z.object({ posts: z.array(GalleryPostSimpleSchema) });
export type GalleryPostSimple = z.infer<typeof GalleryPostSimpleSchema>;
