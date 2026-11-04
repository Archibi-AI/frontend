"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

/** The app's welcoming slider (WelcomingSliderPage): three portrait slides whose slogans are part of the artwork. */
const SLIDES = [
  { src: "/web-static/brand/home/slide01.jpg", alt: "Take a picture, design it your way with our AI.", position: "center" },
  { src: "/web-static/brand/home/slide02.jpg", alt: "Capture your building, design its exterior using our AI.", position: "center" },
  { src: "/web-static/brand/home/slide03.jpg", alt: "A great tool for designers: Sketch to vision!", position: "top" },
] as const;
const INTERVAL_MS = 6000;

export function AuthSlides() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0">
      {SLIDES.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          sizes="50vw"
          priority={i === 0}
          style={{ objectPosition: s.position }}
          className={cn("object-cover transition-opacity duration-700", i === active ? "opacity-100" : "opacity-0")}
          aria-hidden={i !== active}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/55 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[620px] px-10 pb-14">
        <h2 className="font-display text-[30px] font-bold leading-tight text-white xl:text-[34px]">
          Let’s design your <span className="text-brand-bright">dream space</span>
        </h2>
        <p className="mt-3 text-base text-white/80">Snap a photo, choose a style, see the magic.</p>
        <div className="mt-6 flex gap-2" role="tablist" aria-label="Slides">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn("h-1.5 rounded-pill transition-all", i === active ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
