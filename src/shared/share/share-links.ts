/** Share-intent URLs. Pure functions, so they are easy to test and never touch the DOM. */
export interface ShareTarget {
  /** The link people land on. */
  url: string;
  /** The message that goes with it. */
  text: string;
  /** Public image URL for Pinterest. */
  imageUrl?: string;
}

const q = (params: Record<string, string | undefined>) =>
  Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");

export const twitterUrl = ({ url, text }: ShareTarget) => `https://twitter.com/intent/tweet?${q({ text, url })}`;
export const linkedinUrl = ({ url }: ShareTarget) => `https://www.linkedin.com/sharing/share-offsite/?${q({ url })}`;
export const pinterestUrl = ({ url, text, imageUrl }: ShareTarget) => `https://www.pinterest.com/pin/create/button/?${q({ url, media: imageUrl, description: text })}`;
export const facebookUrl = ({ url }: ShareTarget) => `https://www.facebook.com/sharer/sharer.php?${q({ u: url })}`;
export const telegramUrl = ({ url, text }: ShareTarget) => `https://t.me/share/url?${q({ url, text })}`;

const TYPE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "image/avif": "avif" };

/** A readable file name for the downloaded picture; the real content type (when known) decides the extension. */
export function downloadName(title: string, url: string, contentType?: string): string {
  const typed = TYPE_EXT[(contentType ?? "").split(";")[0]!.trim().toLowerCase()];
  const ext = typed ?? /\.(jpe?g|png|webp|gif|svg|avif)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? "jpg";
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "archibi-design";
  return `${base}.${ext}`;
}
