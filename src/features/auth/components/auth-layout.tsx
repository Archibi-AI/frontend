import type { ReactNode } from "react";
import { AuthSlides } from "./auth-slides";

/** Split auth shell: the app's welcome slides on the left, the form on the right.
 *  Two equal halves with their content centred, so it stays balanced from 1024 px to ultra-wide screens. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <aside className="relative hidden w-1/2 shrink-0 overflow-hidden bg-night lg:block" aria-label="Archibi AI">
        <AuthSlides />
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
