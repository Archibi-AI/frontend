import type { ReactNode } from "react";

/** Eyebrow + Poppins title — the heading pattern from the Uritect professionals panel. */
export function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-3">
          <span className="eyebrow-rule" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="font-display text-[28px] font-medium leading-tight text-ink-2 md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-subtle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
