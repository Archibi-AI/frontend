"use client";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { RemoteImage } from "@/shared/ui/remote-image";
import { groupSections } from "../model/redesign";
import type { FilterGroup } from "../schemas";

function OptionCard({ title, image, selected, onClick }: { title: string; image?: string | null; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn("relative size-[120px] shrink-0 overflow-hidden rounded-md bg-track text-left outline-offset-2", selected ? "ring-2 ring-brand" : "ring-1 ring-line hover:ring-line-strong")}
    >
      {image && <RemoteImage src={image} alt="" className="absolute inset-0 size-full object-cover" />}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-6 text-xs font-medium text-white">{title}</span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-brand text-white">
          <Check className="size-3" aria-hidden />
        </span>
      )}
    </button>
  );
}

/** Every X1 group is a single-select row of image cards; groups with `sections` get sub-headings (FilterScreen). */
export function FilterRows({ groups, selection, onPick }: { groups: FilterGroup[]; selection: Record<string, string>; onPick: (group: string, value: string) => void }) {
  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const sections = groupSections(g);
        const row = (options: FilterGroup["options"]) => (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2" role="group" aria-label={g.title}>
            {options.map((o) => (
              <OptionCard key={o.title} title={o.title} image={o.image} selected={selection[g.title] === o.title} onClick={() => onPick(g.title, selection[g.title] === o.title ? "" : o.title)} />
            ))}
          </div>
        );
        return (
          <section key={g.title} aria-labelledby={`f-${g.title}`}>
            <h3 id={`f-${g.title}`} className="mb-2 text-sm font-bold text-ink-2">{g.title}</h3>
            {sections ? (
              <div className="space-y-3">
                {sections.map((s, i) => (
                  <div key={`${s.title ?? ""}${i}`}>
                    {s.title && <p className="mb-1 text-xs font-medium uppercase tracking-[.04em] text-subtle">{s.title}</p>}
                    {row(s.options)}
                  </div>
                ))}
              </div>
            ) : (
              row(g.options)
            )}
          </section>
        );
      })}
    </div>
  );
}
