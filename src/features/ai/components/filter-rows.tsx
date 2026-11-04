"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { RemoteImage } from "@/shared/ui/remote-image";
import { groupSections } from "../model/redesign";
import type { FilterGroup } from "../schemas";

const CUSTOM_VALUE_MAX_LENGTH = 40;
/** FilterOptionsSheet.toSingularLabel */
const singular = (title: string) => (title.trim().toLowerCase() === "angles" ? "angle" : title.trim().toLowerCase());

/** FilterOptionCard.kt: with an image → 4:3 picture + title underneath; without one → a text-only card. Selected = red border + red bold title. */
function OptionCard({ title, image, selected, onClick }: { title: string; image?: string | null; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl bg-surface text-left outline-offset-2",
        selected ? "border-2 border-brand" : "border border-line hover:border-line-strong",
      )}
    >
      {image && (
        <span className="block aspect-[4/3] w-full bg-track">
          <RemoteImage src={image} alt={title} className="size-full object-cover" />
        </span>
      )}
      <span className={cn("flex h-11 items-center justify-center px-2 text-center text-[13px] leading-tight", selected ? "font-bold text-brand" : "font-semibold text-ink-3")}>
        <span className="line-clamp-2">{title}</span>
      </span>
    </button>
  );
}

/** FilterSectionHeader.kt: a short red rule + an extra-bold title. */
function SectionHeader({ title, first }: { title: string; first: boolean }) {
  return (
    <div className={cn("col-span-full flex items-center px-2.5 pb-0.5", first ? "pt-1" : "pt-5")}>
      <span aria-hidden className="mr-2 h-0.5 w-5 bg-brand" />
      <h3 className="text-[17px] font-extrabold text-ink-2">{title}</h3>
    </div>
  );
}

/** FilterOptionsSheet.kt: the picker dialog — 2-column grid of option cards under section headers, then "Didn't find your …?". */
function FilterDialog({ group, value, onSelect, onValueChange, onClose }: { group: FilterGroup; value: string; onSelect: (v: string) => void; onValueChange: (v: string) => void; onClose: () => void }) {
  const sections: Array<{ title?: string | null; options: FilterGroup["options"] }> = groupSections(group) ?? [{ title: null, options: group.options }];
  const optionTitles = new Set(sections.flatMap((s) => s.options.map((o) => o.title)));
  const picked = optionTitles.has(value) ? value : "";
  const [custom, setCustom] = useState(value && !optionTitles.has(value) ? value : "");
  const name = singular(group.title);
  const valueToSave = custom.trim() || picked;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" className="md:max-h-[85vh]">
        <DialogTitle className="sr-only">{group.title}</DialogTitle>
        <DialogDescription className="sr-only">Pick a {name}, or type your own.</DialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {sections.map((s, i) => (
            <SectionBlock key={`${s.title ?? ""}${i}`} title={s.title} first={i === 0}>
              {s.options.map((o) => (
                <OptionCard key={o.title} title={o.title} image={o.image} selected={custom.trim() === "" && value === o.title} onClick={() => onSelect(o.title)} />
              ))}
            </SectionBlock>
          ))}
        </div>
        <div className="mt-5">
          <p className="text-base font-semibold text-ink-2">
            Didn&apos;t find your <span className="font-bold text-brand">{name}</span>?
          </p>
          <p className="mb-2 mt-0.5 text-[13px] text-ink-3">No worries, type your own below.</p>
          <input
            type="text"
            value={custom}
            maxLength={CUSTOM_VALUE_MAX_LENGTH}
            placeholder={`Your ${name}`}
            aria-label={`Your ${name}`}
            onChange={(e) => {
              const next = e.target.value.slice(0, CUSTOM_VALUE_MAX_LENGTH);
              setCustom(next);
              onValueChange(next.trim() || picked);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSelect(valueToSave);
            }}
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-subtle focus:border-brand focus:outline-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionBlock({ title, first, children }: { title?: string | null; first: boolean; children: React.ReactNode }) {
  return (
    <>
      {title && title.trim() && <SectionHeader title={title} first={first} />}
      {children}
    </>
  );
}

/**
 * FiltersView (filtersRow.kt): one dark dropdown button per filter group — it shows the pick (or the group's name) —
 * and tapping it opens that group's picker dialog (a bottom sheet on phones, centred on larger screens).
 */
export function FilterRows({ groups, selection, onPick }: { groups: FilterGroup[]; selection: Record<string, string>; onPick: (group: string, value: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const group = groups.find((g) => g.title === open);
  return (
    <>
      <div role="group" aria-label="Design options" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <button
            key={g.title}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(g.title)}
            className="flex h-12 items-center justify-between gap-2 rounded-md bg-ink-2 px-4 text-left text-sm font-bold text-white transition-colors hover:bg-ink"
          >
            <span className="truncate">{selection[g.title] || g.title}</span>
            <ChevronDown className="size-5 shrink-0" aria-hidden />
          </button>
        ))}
      </div>
      {group && (
        <FilterDialog
          key={group.title}
          group={group}
          value={selection[group.title] ?? ""}
          onSelect={(v) => {
            onPick(group.title, v);
            setOpen(null);
          }}
          onValueChange={(v) => onPick(group.title, v)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
