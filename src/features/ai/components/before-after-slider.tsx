"use client";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { RemoteImage } from "@/shared/ui/remote-image";

const STEP = 5;
const clamp = (n: number) => Math.min(100, Math.max(0, n));

/** ImageSlider of the app's result screen: drag, touch or ←/→ to compare before and after. */
export function BeforeAfterSlider({ before, after, onAfterError }: { before: string; after: string; onAfterError?: () => void }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(clamp(((clientX - r.left) / r.width) * 100));
  };
  const onPointerDown = (e: PointerEvent) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); };
  const onPointerMove = (e: PointerEvent) => { if (e.buttons > 0) move(e.clientX); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setPos((p) => clamp(p - STEP)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setPos((p) => clamp(p + STEP)); }
    if (e.key === "Home") setPos(0);
    if (e.key === "End") setPos(100);
  };
  return (
    <div ref={box} onPointerDown={onPointerDown} onPointerMove={onPointerMove} className="relative mx-auto aspect-[4/3] w-full max-w-3xl touch-none select-none overflow-hidden rounded-md bg-track">
      <RemoteImage src={after} alt="After: the AI design" onError={onAfterError} className="absolute inset-0 size-full object-cover" loading="eager" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <RemoteImage src={before} alt="Before: your original photo" className="absolute inset-0 size-full object-cover" loading="eager" />
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-black/60 px-2 py-1 text-xs font-bold uppercase text-white">Before</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-sm bg-black/60 px-2 py-1 text-xs font-bold uppercase text-white">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Before and after comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKey}
        className="absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow-pop"
        style={{ left: `${pos}%` }}
      >
        <span aria-hidden className="text-lg leading-none">↔</span>
      </div>
    </div>
  );
}
