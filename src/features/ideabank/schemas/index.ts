import { z } from "zod";

/** frontend/ideabank/api/main-menu-posts.md (KMP GalleryPostSimpleDC / MainMenuImagesResponse) */
export const GalleryPostSimpleSchema = z.object({
  uuid: z.number().int(),
  image: z.string(),
  /** Card-size WebP for the feed; null until the backend has built it — then fall back to `image`. */
  thumbnail: z.string().nullish(),
  width: z.number().int().nullish(),
  height: z.number().int().nullish(),
  image_width: z.number().int().nullish(),
  image_height: z.number().int().nullish(),
});
export const MainMenuImagesSchema = z.object({ posts: z.array(GalleryPostSimpleSchema) });
export type GalleryPostSimple = z.infer<typeof GalleryPostSimpleSchema>;

/** GET ai/gallery/main-menu/tags/ — frontend/ideabank/api/main-menu-tags.md */
export const GalleryTagSchema = z.object({ id: z.number().int(), tag: z.string() });
export const MainMenuTagsSchema = z.array(GalleryTagSchema);
export type GalleryTag = z.infer<typeof GalleryTagSchema>;

/** GET ai/gallery/post/ — frontend/ideabank/api/post.md (the image is NOT in this response) */
export const PostPageSchema = z.object({
  tags: z.array(GalleryTagSchema),
  googlePlay: z.string().optional(),
  likeStatus: z.object({ hasUserLiked: z.boolean(), count: z.number().int() }).optional(),
  isFavorite: z.boolean().default(false),
});

/** POST ai/gallery/post/favorite/ — frontend/ideabank/api/post-favorite.md */
export const FavoriteToggleSchema = z.object({ isFavorite: z.boolean() });

/** What the browser gets for one post: Django's post page + the image remembered from the feed (if any). */
export const PostViewSchema = z.object({
  uuid: z.number().int(),
  tags: z.array(GalleryTagSchema),
  isFavorite: z.boolean(),
  likeCount: z.number().int(),
  item: z.object({ image: z.string(), width: z.number().int().nullable(), height: z.number().int().nullable() }).nullable(),
});
export type PostView = z.infer<typeof PostViewSchema>;
