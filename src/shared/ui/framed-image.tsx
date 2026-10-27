import { cn } from "@/shared/lib/cn";
import { RemoteImage } from "./remote-image";

/**
 * Shows the whole picture (never cropped) inside a fixed frame: the picture is contained, and a blurred copy of it
 * fills the leftover space so any aspect ratio still looks designed. Give the frame its size via `className`.
 */
export function FramedImage({ src, alt, className, priority = false }: { src?: string | null; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-track", className)}>
      {src && (
        <>
          <RemoteImage src={src} alt="" aria-hidden loading={priority ? "eager" : "lazy"} className="absolute inset-0 size-full scale-110 object-cover opacity-70 blur-2xl" />
          <RemoteImage src={src} alt={alt} loading={priority ? "eager" : "lazy"} className="relative size-full object-contain" />
        </>
      )}
    </div>
  );
}
