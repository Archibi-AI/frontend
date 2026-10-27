import { FolderOpen, Lightbulb, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const POINTS = [
  { icon: Sparkles, title: "Redesign with AI", description: "Restyle any room, facade or garden from a single photo." },
  { icon: Lightbulb, title: "Find your idea", description: "Browse real interiors, exteriors and landscapes in the Idea Bank." },
  { icon: Users, title: "Hire trusted pros", description: "Connect with vetted architects, designers and builders." },
  { icon: FolderOpen, title: "One account, everywhere", description: "Your projects and renders stay in sync with the Archibi app." },
] as const;

/** Split auth shell — the Uritect professionals panel pattern: dark photo hero on the left, form on the right. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <aside className="relative hidden w-[45%] shrink-0 overflow-hidden bg-night lg:block" aria-hidden={false}>
        <Image src="/web-static/brand/auth.jpg" alt="" fill sizes="45vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_18_18/.84)_0%,rgb(18_18_18/.9)_55%,rgb(18_18_18/.97)_100%)]" aria-hidden />
        <div className="relative flex h-full flex-col justify-start gap-10 overflow-y-auto p-12 pt-16">
          <div className="animate-fade-rise">
            <h2 className="hero-display mb-4 text-white">
              Design it. Find it.
              <br />
              Build it <span className="text-brand-bright">with Archibi.</span>
            </h2>
            <p className="max-w-[380px] text-base leading-[1.6] text-night-text">Everything for your next space, in one place.</p>
          </div>
          <ul className="space-y-6">
            {POINTS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-white/15 bg-white/5">
                  <Icon size={18} strokeWidth={1.5} className="text-brand-bright" aria-hidden />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-white">{title}</p>
                  <p className="text-[13px] text-night-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex flex-1 items-center justify-center bg-surface px-6 py-12 md:py-16">
        <div className="w-full max-w-[420px] animate-fade-rise">{children}</div>
      </div>
    </div>
  );
}

export function AuthHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <p className="eyebrow mb-3">
        <span className="eyebrow-rule" aria-hidden />
        {eyebrow}
      </p>
      <h1 className="mb-2 font-display text-[28px] font-medium text-ink-2">{title}</h1>
      {subtitle && <p className="text-[15px] text-subtle">{subtitle}</p>}
    </header>
  );
}

export function FormAlert({ children, kind = "error" }: { children: ReactNode; kind?: "error" | "success" }) {
  if (!children) return null;
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={
        kind === "error"
          ? "mb-6 border border-danger px-4 py-3 text-sm text-danger"
          : "mb-6 border border-success px-4 py-3 text-sm text-success"
      }
    >
      {children}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-[.08em] text-subtle" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
