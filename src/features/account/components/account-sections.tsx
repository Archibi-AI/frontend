import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function AccountSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[.08em] text-ink-2">{title}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">{children}</ul>
    </section>
  );
}

interface RowProps {
  label: string;
  hint?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  trailing?: ReactNode;
  className?: string;
}

const rowClass = "flex min-h-14 items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-alt";

function RowBody({ label, hint, icon: Icon, trailing, external }: RowProps & { external?: boolean }) {
  return (
    <>
      {Icon && <Icon className="size-5 shrink-0 text-subtle" strokeWidth={1.5} aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] text-ink-3">{label}</span>
        {hint && <span className="block text-xs text-subtle">{hint}</span>}
      </span>
      {trailing}
      {external ? <span className="sr-only">(opens in a new tab)</span> : null}
      <ChevronRight className="size-4 shrink-0 text-line-strong" aria-hidden />
    </>
  );
}

export function AccountRow(props: RowProps & { href: string; external?: boolean }) {
  const { href, external, className } = props;
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cn(rowClass, className)}>
          <RowBody {...props} />
        </a>
      ) : (
        <Link href={href} className={cn(rowClass, className)}>
          <RowBody {...props} />
        </Link>
      )}
    </li>
  );
}

export function AccountButtonRow({ onClick, ...props }: RowProps & { onClick?: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={cn(rowClass, "w-full", props.className)}>
        <RowBody {...props} />
      </button>
    </li>
  );
}
