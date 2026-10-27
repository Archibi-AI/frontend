"use client";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { decodeSelection, encodeSelection, selectionCount, type Selection } from "../model/filters";
import type { FilterDef } from "../schemas";

/**
 * Filters built from H9 (user/filters). Applying writes `?filters=<base64url selection>` so a filtered view is shareable;
 * the server page turns it into the app's JSON (toApiFilters). Every filter type is shown as selectable options.
 */
export function FilterPanel({ scope, selection, pathname }: { scope: { category: string } | { tag: string }; selection: Selection; pathname: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Selection>(selection);
  const { data } = useQuery({
    queryKey: ["hiring", "filters", scope],
    staleTime: 5 * 60_000,
    queryFn: async () => (await bffFetch<{ filters: FilterDef[] }>("/bff/hiring/filters", { query: scope })).filters,
  });
  const defs = (data ?? []).filter((d) => d.options.length > 0);
  if (defs.length === 0) return null;

  const toggle = (title: string, option: string) =>
    setDraft((d) => {
      const cur = d[title] ?? [];
      return { ...d, [title]: cur.includes(option) ? cur.filter((o) => o !== option) : [...cur, option] };
    });
  const apply = (next: Selection) => {
    const encoded = encodeSelection(next);
    setOpen(false);
    router.replace(encoded ? `${pathname}?filters=${encoded}` : pathname, { scroll: false });
  };
  const applied = selectionCount(decodeSelection(encodeSelection(selection)));

  return (
    <div className="mb-6">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters{applied > 0 ? ` (${applied})` : ""}
      </Button>
      {open && (
        <div className="mt-3 space-y-5 border border-line bg-surface p-5">
          {defs.map((d) => (
            <fieldset key={d.title}>
              <legend className="mb-2 text-sm font-medium capitalize text-ink-2">{d.title}</legend>
              <div className="flex flex-wrap gap-2">
                {d.options.map((o) => (
                  <Chip key={o} selected={draft[d.title]?.includes(o) ?? false} onClick={() => toggle(d.title, o)}>
                    {o}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="flex gap-3">
            <Button size="sm" onClick={() => apply(draft)}>
              Apply
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setDraft({}); apply({}); }}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
