"use client";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfessionalCard } from "@/features/hiring/components/professional-card";
import { routes } from "@/shared/config/routes";
import { ErrorView } from "@/shared/errors/error-view";
import { Button, buttonVariants } from "@/shared/ui/button";
import { RemoteImage } from "@/shared/ui/remote-image";
import { Skeleton } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";
import { serviceHref, serviceById } from "../model/services";
import type { FurnitureResponse, JobView, SubmitResponse } from "../schemas";
import { useAiSession } from "./ai-session";
import { BeforeAfterSlider } from "./before-after-slider";
import { FurnitureResults } from "./furniture-results";
import { JobProgress } from "./job-progress";
import { POLL_GIVE_UP_MS, useJob } from "./use-ai";

/** Where a failed job lands: the app's outcome screens (architecture/07 §4). */
export function outcomeRoute(code: string, service: string): string {
  switch (code) {
    case "OUT_OF_CREDIT": return routes.ai.outOfCredits();
    case "SERVICE_NOT_IN_PLAN": return routes.ai.serviceNotInPlan(service);
    case "SERVER": case "REQUEST_TIMEOUT": return routes.ai.serverError();
    default: return routes.ai.error();
  }
}

const SERVICE_KEY = { interior: "interior_design", exterior: "exterior_design", landscape: "landscape_design", sketch: "sketch_to_render", furniture: "furniture_finder" } as const;

export function ResultView({ projectUuid }: { projectUuid: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const session = useAiSession();
  const job = useJob(projectUuid);
  const [startedAt] = useState(() => Date.now());
  const data = job.data;

  // Hard stop after 12 min of polling: treat as the app's generic failure.
  useEffect(() => {
    if (data?.state !== "running" && data?.state !== "saving") return;
    const left = Math.max(0, POLL_GIVE_UP_MS - (Date.now() - startedAt));
    const t = setTimeout(() => router.replace(routes.ai.error()), left);
    return () => clearTimeout(t);
  }, [data?.state, router, startedAt]);

  useEffect(() => {
    if (data?.state === "failed") router.replace(outcomeRoute(data.error.code, SERVICE_KEY[data.service]));
    if (data?.state === "done") {
      void qc.invalidateQueries({ queryKey: ["me", "credits"] });
      void qc.invalidateQueries({ queryKey: ["me", "projects"] });
    }
  }, [data, qc, router]);

  if (job.isPending) return <div role="status" aria-label="Loading"><Skeleton className="mx-auto h-72 w-full max-w-3xl" /></div>;
  if (job.isError) return job.error.code === "NOT_FOUND"
    ? <ErrorView error={job.error} />
    : <ErrorView error={job.error} onRetry={() => job.refetch()} />;
  if (!data || data.state === "failed") return null; // redirecting
  if (data.state !== "done") return <JobProgress state={data.state} filters={data.filters} furniture={data.service === "furniture"} />;

  return data.service === "furniture"
    ? <FurnitureDone job={data} />
    : <RedesignDone projectUuid={projectUuid} job={data} before={session.getBefore(projectUuid)} />;
}

function Summary({ filters }: { filters: JobView["filters"] }) {
  if (filters.length === 0) return null;
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Your choices">
      {filters.map((f) => <li key={f.title} className="rounded-pill border border-line bg-surface px-3 py-1 text-xs text-muted"><span className="text-subtle">{f.title}:</span> {f.value}</li>)}
    </ul>
  );
}

function RedesignDone({ projectUuid, job, before }: { projectUuid: string; job: Extract<JobView, { state: "done" }>; before?: string }) {
  const toast = useToast();
  const [expired, setExpired] = useState(false);
  const result = job.result as SubmitResponse;
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "My Archibi design", url });
      else { await navigator.clipboard.writeText(url); toast({ kind: "success", title: "Link copied" }); }
    } catch { /* user dismissed the share sheet */ }
  };
  return (
    <div>
      {expired ? (
        <div role="alert" className="mx-auto max-w-xl border border-line bg-surface p-6 text-center text-sm text-muted">
          This image link has expired. <Link href={routes.account.projects()} className="font-medium text-brand underline">Open it in My Projects</Link>.
        </div>
      ) : before ? (
        <BeforeAfterSlider before={before} after={result.output} onAfterError={() => setExpired(true)} />
      ) : (
        <RemoteImage src={result.output} alt="Your AI design" loading="eager" onError={() => setExpired(true)} className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md object-contain" />
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={`/bff/ai/jobs/${projectUuid}/download`} className={buttonVariants({ variant: "secondary", size: "sm" })}><Download className="size-4" aria-hidden /> Download</a>
        <Button variant="secondary" size="sm" onClick={share}><Share2 className="size-4" aria-hidden /> Share</Button>
        <Link href={serviceHref(job.service)} className={buttonVariants({ size: "sm" })}>Generate another</Link>
        <Link href={routes.account.projects()} className={buttonVariants({ variant: "ghost", size: "sm" })}>See it in My Projects</Link>
      </div>
      <Summary filters={job.filters} />
      {result.professionals.length > 0 && (
        <section aria-labelledby="pros" className="mt-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="pros" className="font-display text-xl font-medium text-ink-2">Bring it to life with a pro</h2>
            <Link href={routes.hiring.index()} className="text-[13px] font-bold uppercase tracking-[.02em] text-brand hover:underline">Find a pro</Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {result.professionals.map((p) => <li key={p.uuid}><ProfessionalCard pro={p} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function FurnitureDone({ job }: { job: Extract<JobView, { state: "done" }> }) {
  const result = job.result as FurnitureResponse;
  return (
    <div>
      <FurnitureResults result={result.output} />
      <div className="mt-8 flex justify-center">
        <Link href={serviceById("furniture").href} className={buttonVariants({ size: "sm" })}>Search another photo</Link>
      </div>
    </div>
  );
}
