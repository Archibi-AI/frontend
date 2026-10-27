"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { ImageDropzone } from "@/shared/ui/image-dropzone";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";
import { ErrorView } from "@/shared/errors/error-view";
import { MAX_PROMPT, selectionToFields, summarize, type Mode, type RedesignPart, PART_SERVICE, PART_SERVICE_KEY } from "../model/redesign";
import { isLocked } from "../model/services";
import { OPTIONAL_PARAMS, type Service } from "../schemas";
import { useAiSession } from "./ai-session";
import { creditsText } from "./credits-pill";
import { FilterRows } from "./filter-rows";
import { OptionalFilters, type OptionalPick } from "./optional-filters";
import { useCredits, useFilters } from "./use-ai";

const MODES: Array<{ id: Mode; title: string; blurb: string }> = [
  { id: "beautiful", title: "Beautiful", blurb: "Keeps your layout and refines the style." },
  { id: "creative", title: "Creative", blurb: "A bolder transformation of the space." },
];
const PARTS: RedesignPart[] = ["Interior", "Exterior", "Landscape"];

export interface StudioProps {
  /** Redesign page part, or "sketch" for Sketch to Render (which has its own Interior/Exterior/Landscape tabs). */
  kind: RedesignPart | "sketch";
  title: string;
  subtitle: string;
  tip: string;
}

/** FilterScreen + sketchToRender DesignScreen on one page: upload, mode/part, filters, prompt, Generate. */
export function StudioForm({ kind, title, subtitle, tip }: StudioProps) {
  const router = useRouter();
  const session = useAiSession();
  const credits = useCredits();
  const [mode, setMode] = useState<Mode>("beautiful");
  const [sketchPart, setSketchPart] = useState<RedesignPart>("Interior");
  const [file, setFile] = useState<File>();
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [optional, setOptional] = useState<Record<string, OptionalPick>>({});
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const part: RedesignPart = kind === "sketch" ? sketchPart : kind;
  const section = kind === "sketch" ? "sketch-to-render" : mode;
  const service: Service = kind === "sketch" ? "sketch" : PART_SERVICE[kind];
  const serviceKey = kind === "sketch" ? "sketch_to_render" : PART_SERVICE_KEY[kind];
  const filters = useFilters(part, section);
  const optionalData = filters.data?.optional_filters;
  const locked = isLocked(credits.data?.service_access, serviceKey);

  // Each mode/part serves its own catalog: picks from the previous one no longer apply.
  const resetPicks = () => {
    setSelection({});
    setOptional({});
  };
  const groups = useMemo(() => filters.data?.options ?? [], [filters.data]);

  async function submit() {
    if (!file) return;
    if (locked) return router.push(routes.ai.serviceNotInPlan(serviceKey)); // before uploading (submitButton.kt:57-59)
    setBusy(true);
    setError(undefined);
    const form = new FormData();
    form.set("service", service);
    if (kind === "sketch") form.set("sketchPart", sketchPart);
    else form.set("mode", mode);
    const f = selectionToFields(selection);
    for (const [k, v] of Object.entries({ ...f, prompt: prompt.trim() })) if (v) form.set(k, v);
    for (const p of OPTIONAL_PARAMS) if (optional[p]) form.set(p, optional[p]!.id);
    form.set("filterSummary", JSON.stringify(summarize(selection, Object.fromEntries(Object.values(optional).map((o) => [o.label.split(": ")[0]!, o.label.split(": ")[1] ?? o.label])), prompt)));
    form.set("beforeImage", file, file.name);
    try {
      const { projectUuid } = await bffFetch<{ projectUuid: string }>("/bff/ai/jobs", { method: "POST", body: form });
      session.setBefore(projectUuid, URL.createObjectURL(file));
      router.push(routes.ai.result(projectUuid));
    } catch (e) {
      setBusy(false);
      const err = e instanceof AppError ? e : new AppError("UNKNOWN", 0);
      if (err.code === "SERVICE_NOT_IN_PLAN") return router.push(routes.ai.serviceNotInPlan(serviceKey));
      if (err.code === "OUT_OF_CREDIT") return router.push(routes.ai.outOfCredits());
      if (err.code === "SERVER") return router.push(routes.ai.serverError());
      setError(err.message);
    }
  }

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-3"><span className="eyebrow-rule" aria-hidden />AI Design Studio</p>
        <h1 className="font-display text-[28px] font-medium leading-tight text-ink-2 md:text-[32px]">{title}</h1>
        <p className="mt-2 max-w-xl text-[15px] text-subtle">{subtitle}</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ImageDropzone onFile={(f) => { setFile(f); setError(undefined); }} label="Upload a photo" />
          <p className="mt-3 text-sm text-muted">{tip}</p>
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        </div>
        <div className="min-w-0 space-y-8">
          {kind === "sketch" ? (
            <div role="tablist" aria-label="Sketch type" className="flex gap-6 border-b border-line">
              {PARTS.map((p) => (
                <button key={p} role="tab" type="button" aria-selected={sketchPart === p} onClick={() => { setSketchPart(p); resetPicks(); }}
                  className={cn("-mb-px h-11 border-b-2 text-sm font-medium", sketchPart === p ? "border-brand text-ink" : "border-transparent text-subtle")}>
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div role="radiogroup" aria-label="Design mode" className="grid gap-3 sm:grid-cols-2">
              {MODES.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => { setMode(m.id); resetPicks(); }}
                  className={cn("border p-4 text-left", mode === m.id ? "border-brand bg-brand-tint" : "border-line bg-surface hover:border-line-strong")}>
                  <span className="block font-display text-base font-medium text-ink-2">{m.title}</span>
                  <span className="mt-1 block text-sm text-muted">{m.blurb}</span>
                </button>
              ))}
            </div>
          )}
          {filters.isPending ? (
            <div className="space-y-4" role="status" aria-label="Loading filters">
              <Skeleton className="h-6 w-32" /><Skeleton className="h-[120px] w-full" /><Skeleton className="h-6 w-32" /><Skeleton className="h-[120px] w-full" />
            </div>
          ) : filters.isError ? (
            <ErrorView error={filters.error} onRetry={() => filters.refetch()} />
          ) : (
            <>
              <FilterRows groups={groups} selection={selection} onPick={(g, v) => setSelection((s) => ({ ...s, [g]: v }))} />
              {optionalData && (
                <OptionalFilters data={optionalData} picks={optional} onPick={(param, pick) => setOptional((o) => { const next = { ...o }; if (pick) next[param] = pick; else delete next[param]; return next; })} />
              )}
            </>
          )}
          <div>
            <Textarea label="Describe it (optional)" value={prompt} maxLength={MAX_PROMPT} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. bright, with lots of natural light" />
            <p className="mt-1 text-right text-xs text-subtle">{prompt.length}/{MAX_PROMPT}</p>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-4 border-t border-line bg-surface/95 py-4 backdrop-blur">
        <p className="text-sm text-muted" aria-live="polite">
          {credits.data ? creditsText(credits.data.ai_credits) : ""}
          {!file && <span className="ml-2 text-subtle">Choose a photo to continue.</span>}
        </p>
        <Button onClick={submit} disabled={!file} loading={busy} size="lg">Generate</Button>
      </div>
    </>
  );
}
