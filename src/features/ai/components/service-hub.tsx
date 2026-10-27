"use client";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { AI_SERVICES, isLocked } from "../model/services";
import { CreditsPill } from "./credits-pill";
import { useCredits, useRecentJobs } from "./use-ai";

/** AH1 locked cards go to service-not-in-plan; AH3 running jobs are listed. */
export function ServiceHub() {
  const credits = useCredits();
  const jobs = useRecentJobs();
  const running = (jobs.data ?? []).filter((j) => j.state === "PROVIDER_RUNNING" || j.state === "PROVIDER_DONE" || j.state === "SAVING");
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-xl text-[15px] text-subtle">Pick a service. Upload a photo, choose a style and Archibi AI designs it in under two minutes.</p>
        <CreditsPill />
      </div>
      {running.length > 0 && (
        <section aria-label="In progress" className="mb-8 border border-line bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-[.02em] text-ink-2">In progress</h2>
          <ul className="space-y-1">
            {running.map((j) => (
              <li key={j.projectUuid}>
                <Link href={routes.ai.result(j.projectUuid)} className="text-sm text-brand hover:underline">
                  {AI_SERVICES.find((s) => s.id === j.service)?.title ?? j.service} — still designing, open it
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AI_SERVICES.map((s) => {
          const locked = isLocked(credits.data?.service_access, s.key);
          return (
            <li key={s.id}>
              <Link
                href={locked ? routes.ai.serviceNotInPlan(s.key) : s.href}
                className={cn("group flex h-full flex-col justify-between gap-6 border border-line bg-surface p-6 transition-shadow hover:shadow-md", locked && "bg-surface-alt")}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-medium text-ink-2">{s.title}</h2>
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-track px-2 py-1 text-xs font-medium text-muted">
                        <Lock className="size-3" aria-hidden /> Not in your plan
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted">{s.blurb}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.02em] text-brand">
                  {locked ? "See plans" : "Start"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
