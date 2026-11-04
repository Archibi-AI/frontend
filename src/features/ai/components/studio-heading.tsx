import type { ReactNode } from "react";
import { HOME_HEADING } from "../model/home";

/** The app's Home heading (DesignStudioSection.kt HomeHeading), on the hub and on every AI service page. */
export function StudioHeading({ eyebrow, aside }: { eyebrow?: string; aside?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-3"><span className="eyebrow-rule" aria-hidden />{eyebrow}</p>}
        <h1 className="font-display text-[26px] font-bold leading-tight text-[#1a1a1a] md:text-[32px]">
          {HOME_HEADING.before} <span className="text-brand-strong">{HOME_HEADING.highlight}</span>
        </h1>
        <p className="mt-2 text-[15px] text-[#8a8a8a]">{HOME_HEADING.subtitle}</p>
      </div>
      {aside}
    </header>
  );
}
