"use client";
import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { FramedImage } from "@/shared/ui/framed-image";
import { cn } from "@/shared/lib/cn";
import { HOME_FURNITURE, HOME_HEADING, HOME_STUDIO_TITLE, HOME_TOOLS } from "../model/home";
import { AI_SERVICES, isLocked, serviceById } from "../model/services";
import { CreditsPill } from "./credits-pill";
import { useCredits, useRecentJobs } from "./use-ai";

/** AH1 locked cards go to service-not-in-plan; AH3 running jobs are listed. */
export function ServiceHub() {
  const credits = useCredits();
  const jobs = useRecentJobs();
  const running = (jobs.data ?? []).filter((j) => j.state === "PROVIDER_RUNNING" || j.state === "PROVIDER_DONE" || j.state === "SAVING");
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-bold leading-tight text-[#1a1a1a] md:text-[32px]">
            {HOME_HEADING.before} <span className="text-brand-strong">{HOME_HEADING.highlight}</span>
          </h1>
          <p className="mt-2 text-[15px] text-[#8a8a8a]">{HOME_HEADING.subtitle}</p>
        </div>
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
      <h2 className="mb-3 mt-5 text-[18px] font-bold text-ink-2">{HOME_STUDIO_TITLE}</h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {HOME_TOOLS.map((tool) => (
          <li key={tool.id}>
            <StudioCard tool={tool} locked={isLocked(credits.data?.service_access, serviceById(tool.id).key)} layout="card" />
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <StudioCard tool={HOME_FURNITURE} locked={isLocked(credits.data?.service_access, serviceById("furniture").key)} layout="strip" />
      </div>
    </>
  );
}

type Tool = { id: (typeof AI_SERVICES)[number]["id"]; title: string; subtitle: string; image: string };

/** DesignStudioCard / FurnitureFinderStrip: banner, bold title, gray one-liner, chevron. A locked service goes to the plan page. */
function StudioCard({ tool, locked, layout }: { tool: Tool; locked: boolean; layout: "card" | "strip" }) {
  const service = serviceById(tool.id);
  const href = locked ? routes.ai.serviceNotInPlan(service.key) : service.href;
  const text = (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] font-bold text-ink-2">{tool.title}</p>
      <p className="truncate text-xs text-subtle">{locked ? "Not in your plan" : tool.subtitle}</p>
    </div>
  );
  const chevron = locked ? <Lock className="size-4 text-subtle" aria-hidden /> : <ChevronRight className="size-5 text-ink-2 transition-transform group-hover:translate-x-0.5" aria-hidden />;
  if (layout === "strip") {
    return (
      <Link href={href} aria-label={tool.title} className="group flex items-center gap-3.5 overflow-hidden rounded-xl border border-line bg-surface p-2.5 transition-shadow hover:shadow-md">
        <FramedImage src={tool.image} alt="" className="h-[60px] w-[88px] shrink-0 rounded-lg" />
        {text}
        {chevron}
      </Link>
    );
  }
  return (
    <Link href={href} aria-label={tool.title} className="group block overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md">
      <FramedImage src={tool.image} alt="" className={cn("aspect-[4/3] w-full", locked && "opacity-60")} />
      <div className="flex items-center gap-2 py-2.5 pl-3 pr-2 pb-3">
        {text}
        {chevron}
      </div>
    </Link>
  );
}
