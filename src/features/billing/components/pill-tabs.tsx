import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** KMP PlanTabs: a grey pill track, the selected pill is white with a soft shadow. Links keep the section in the URL. */
export function PillTrack({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-pill bg-track p-1", className)}>
      {children}
    </div>
  );
}

const pillClass = (selected: boolean) =>
  cn(
    "inline-flex h-10 min-w-24 shrink-0 items-center justify-center rounded-pill px-5 text-[15px] transition-colors",
    selected ? "bg-surface font-semibold text-ink shadow-card" : "font-medium text-subtle hover:text-ink",
  );

export function PillLink({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  return (
    <Link href={href} role="tab" aria-selected={selected} scroll={false} replace className={pillClass(selected)}>
      {children}
    </Link>
  );
}

export function PillButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={selected} onClick={onClick} className={pillClass(selected)}>
      {children}
    </button>
  );
}
