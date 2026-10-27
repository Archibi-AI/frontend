"use client";
import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { cn } from "@/shared/lib/cn";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function ImageDropzone({ onFile, maxBytes = MAX_UPLOAD_BYTES, label = "Upload a photo" }: { onFile: (file: File) => void; maxBytes?: number; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > maxBytes) return setError(`Image is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
    setError(undefined);
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files[0]); }}
      onPaste={(e) => accept(e.clipboardData.files[0])}
      className={cn("relative flex min-h-56 flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center", dragging ? "border-brand bg-brand-tint" : "border-line bg-surface")}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
        <img src={preview} alt="Selected upload preview" className="max-h-72 rounded-md object-contain" />
      ) : (
        <ImagePlus className="size-10 text-subtle" aria-hidden />
      )}
      <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 text-sm font-medium text-brand underline">
        {preview ? "Change photo" : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label={label} onChange={(e) => accept(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
