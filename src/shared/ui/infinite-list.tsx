"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Calls `onLoadMore` once each time the sentinel scrolls into view while more pages exist. */
export function InfiniteSentinel({ hasMore, loading, onLoadMore, children }: { hasMore: boolean; loading: boolean; onLoadMore: () => void; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !loading) onLoadMore();
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore]);
  return <div ref={ref} aria-hidden>{children}</div>;
}
