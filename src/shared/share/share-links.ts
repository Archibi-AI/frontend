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
export const telegramUrl = ({ url, text }: ShareTarget) => `https://t.me/share/url?${q({ url, text })}`;

/** A readable file name for the downloaded picture. */
export function downloadName(title: string, url: string): string {
  const ext = /\.(jpe?g|png|webp|gif)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase().replace("jpeg", "jpg") ?? "jpg";
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "archibi-design";
  return `${base}.${ext}`;
}
