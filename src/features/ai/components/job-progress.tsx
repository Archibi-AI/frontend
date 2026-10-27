"use client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { FilterSummary } from "../schemas";

const STEPS = ["Uploading", "Designing (about 30–90 s)", "Saving"] as const;

/** Running state of the result page: steps, indeterminate bar, tip, and the user's picks. */
export function JobProgress({ state, filters, furniture }: { state: "running" | "saving"; filters: FilterSummary; furniture?: boolean }) {
  const active = state === "saving" ? 2 : 1;
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-xl border border-line bg-surface p-6 text-center">
      <h2 className="font-display text-xl font-medium text-ink-2">{furniture ? "Finding furniture…" : "Designing your space…"}</h2>
      <ol className="mt-5 space-y-2 text-left">
        {STEPS.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 text-sm", i > active ? "text-subtle" : "text-ink-2")}>
            {i < active ? <Check className="size-4 text-success" aria-hidden /> : i === active ? <Loader2 className="size-4 animate-spin text-brand" aria-hidden /> : <span className="size-4 rounded-full border border-line" aria-hidden />}
            {furniture && i === 1 ? "Searching stores (about 30–90 s)" : s}
          </li>
        ))}
      </ol>
      <div className="mt-5 h-1.5 overflow-hidden rounded-pill bg-track" aria-hidden>
        <div className="h-full w-1/3 animate-pulse rounded-pill bg-brand" />
      </div>
      <p className="mt-4 text-sm text-muted">You can leave this page. Your design keeps going and appears in My Projects.</p>
      {filters.length > 0 && (
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-line pt-4 text-left text-sm">
          {filters.map((f) => (
            <div key={f.title} className="contents">
              <dt className="text-subtle">{f.title}</dt>
              <dd className="text-ink-3">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
