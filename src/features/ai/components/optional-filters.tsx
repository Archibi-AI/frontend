"use client";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import type { OptionalFiltersData } from "../schemas";

export interface OptionalPick { param: string; id: string; label: string }

const OPTIONAL_SUFFIX = "(Optional)";

/** Red dot in front of a section title (OptionalFiltersSection.kt TitleDot). */
const TitleDot = () => <span aria-hidden className="mr-2 size-2 shrink-0 rounded-pill bg-brand" />;

/** OptionalGroup: header (title · picked name · arrow) that collapses its options; open by default. */
function OptionalGroup({ header, dotted = false, picked, children }: { header: string; dotted?: boolean; picked?: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center py-3 text-left">
        {dotted && <TitleDot />}
        <span className={cn("font-semibold", dotted ? "text-base text-[#585858]" : "text-[15px] text-subtle")}>{header}</span>
        <span className="ml-auto max-w-40 truncate pl-3 text-[13px] text-brand">{picked}</span>
        <ChevronDown className={cn("size-5 shrink-0 text-[#585858] transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

/** Optional palette (swatches) + materials: single select per param, deselectable (OptionalFilterParams). */
export function OptionalFilters({ data, picks, onPick }: { data: OptionalFiltersData; picks: Record<string, OptionalPick>; onPick: (param: string, pick: OptionalPick | null) => void }) {
  const [open, setOpen] = useState(false);
  const palette = data.color_palette;
  if (!palette?.options.length && data.materials.length === 0) return null;
  const toggle = (param: string, id: number, label: string) => onPick(param, picks[param]?.id === String(id) ? null : { param, id: String(id), label });
  const pickedName = (param: string) => picks[param]?.label.split(": ").at(-1);
  return (
    <section className="border border-line">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-ink-2">
        {data.title || "Optional"}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-1">
          {palette && palette.options.length > 0 && (
            <OptionalGroup header={`${palette.title} ${OPTIONAL_SUFFIX}`} dotted picked={pickedName(palette.param)}>
              <div className="flex flex-wrap gap-3" role="group" aria-label={palette.title}>
                {palette.options.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={picks[palette.param]?.id === String(p.id)}
                    onClick={() => toggle(palette.param, p.id, p.name)}
                    className={cn("flex w-36 flex-col items-center justify-center gap-1.5 rounded-md p-2 text-center text-xs text-muted", picks[palette.param]?.id === String(p.id) ? "ring-2 ring-brand" : "ring-1 ring-line hover:ring-line-strong")}
                  >
                    <span className="flex h-7 w-full overflow-hidden rounded-sm">
                      {p.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </OptionalGroup>
          )}
          {data.materials.length > 0 && (
            <h3 className="flex items-center pb-1 pt-4 text-base font-semibold text-[#585858]"><TitleDot />Materials {OPTIONAL_SUFFIX}</h3>
          )}
          {data.materials.map((m) => (
            <OptionalGroup key={m.key} header={m.title} picked={pickedName(m.param)}>
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
            </OptionalGroup>
          ))}
        </div>
      )}
    </section>
  );
}
