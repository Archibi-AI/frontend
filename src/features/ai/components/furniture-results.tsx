"use client";
import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/shared/ui/empty-state";
import { RemoteImage } from "@/shared/ui/remote-image";
import type { FurnitureResponse, ProductItem } from "../schemas";

export function ProductCard({ p }: { p: ProductItem }) {
  return (
    <li>
      <a href={p.link} target="_blank" rel="noopener nofollow sponsored" className="group flex h-full flex-col border border-line bg-surface hover:shadow-md">
        <div className="aspect-square overflow-hidden bg-track">
          <RemoteImage src={p.thumbnail} alt={p.title} className="size-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-ink-2">{p.title}</h3>
          <p className="text-base font-bold text-ink">{p.price.value}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            {p.source_icon && <RemoteImage src={p.source_icon} alt="" className="size-4" />}
            {p.source}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2 text-xs">
            {p.rating != null ? (
              <span className="inline-flex items-center gap-1 text-muted"><Star className="size-3.5 fill-current text-warning" aria-hidden />{p.rating}{p.reviews != null ? ` (${p.reviews})` : ""}</span>
            ) : <span />}
            <span className={cn("rounded-pill px-2 py-0.5 font-medium", p.in_stock ? "bg-success/10 text-success" : "bg-track text-subtle")}>{p.in_stock ? "In stock" : "Check store"}</span>
          </div>
          <span className="sr-only">Opens the store in a new tab</span>
        </div>
      </a>
    </li>
  );
}

/** Product groups per detected category (`output.result` keys), as the app's furniture results screen. */
export function FurnitureResults({ result }: { result: FurnitureResponse["output"] }) {
  const categories = Object.entries(result.result).filter(([, items]) => items.length > 0);
  const [active, setActive] = useState(categories[0]?.[0]);
  if (!result.success || categories.length === 0) return <EmptyState title="We couldn't find matching products. Try a clearer photo." />;
  const current = categories.find(([name]) => name === active) ?? categories[0]!;
  return (
    <div>
      <div role="tablist" aria-label="Furniture categories" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map(([name, items]) => (
          <button key={name} role="tab" type="button" aria-selected={current[0] === name} onClick={() => setActive(name)}
            className={cn("h-9 shrink-0 rounded-pill border px-4 text-sm font-medium", current[0] === name ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong")}>
            {name} ({items.length})
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" role="tabpanel">
        {current[1].map((p) => <ProductCard key={`${p.position}-${p.link}`} p={p} />)}
      </ul>
    </div>
  );
}
