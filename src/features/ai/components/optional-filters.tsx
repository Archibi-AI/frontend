"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { OptionalFiltersData } from "../schemas";

export interface OptionalPick { param: string; id: string; label: string }

/** Optional palette (swatches) + materials: single select per param, deselectable (OptionalFilterParams). */
export function OptionalFilters({ data, picks, onPick }: { data: OptionalFiltersData; picks: Record<string, OptionalPick>; onPick: (param: string, pick: OptionalPick | null) => void }) {
  const [open, setOpen] = useState(false);
  const palette = data.color_palette;
  if (!palette?.options.length && data.materials.length === 0) return null;
  const toggle = (param: string, id: number, label: string) => onPick(param, picks[param]?.id === String(id) ? null : { param, id: String(id), label });
  return (
    <section className="border border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-ink-2">
        {data.title || "Optional"}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="space-y-5 border-t border-line p-4">
          {palette && palette.options.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink-2">{palette.title}</h3>
              <div className="flex flex-wrap gap-3" role="group" aria-label={palette.title}>
                {palette.options.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={picks[palette.param]?.id === String(p.id)}
                    onClick={() => toggle(palette.param, p.id, p.name)}
                    className={cn("flex flex-col items-start gap-1 rounded-md p-1.5 text-xs text-muted", picks[palette.param]?.id === String(p.id) ? "ring-2 ring-brand" : "ring-1 ring-line hover:ring-line-strong")}
                  >
                    <span className="flex h-7 w-24 overflow-hidden rounded-sm">
                      {p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {data.materials.map((m) => (
            <div key={m.key}>
              <h3 className="mb-2 text-sm font-medium text-ink-2">{m.title}</h3>
              <div className="flex flex-wrap gap-2" role="group" aria-label={m.title}>
                {m.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={picks[m.param]?.id === String(o.id)}
                    onClick={() => toggle(m.param, o.id, `${m.title}: ${o.name}`)}
                    className={cn("h-9 rounded-pill border px-4 text-sm", picks[m.param]?.id === String(o.id) ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong")}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
