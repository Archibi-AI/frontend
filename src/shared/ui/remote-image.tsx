import type { ImgHTMLAttributes } from "react";

/**
 * Plain <img> for user content and S3 presigned URLs: every signature is a different URL, so the Next
 * optimizer would re-encode each load and cache nothing. Explicit width/height avoid layout shift.
 */
export function RemoteImage({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- see doc comment
  return <img alt={alt} loading="lazy" decoding="async" {...props} />;
}
