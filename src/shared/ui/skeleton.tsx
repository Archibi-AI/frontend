import { cn } from "@/shared/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-track", className)} />;
}

const heights = ["h-48", "h-64", "h-56", "h-72"] as const;

export function MasonrySkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 lg:columns-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn("mb-3 w-full break-inside-avoid", heights[i % heights.length])} />
      ))}
    </div>
  );
}
