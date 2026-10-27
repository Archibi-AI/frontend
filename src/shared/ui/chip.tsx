import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip({ selected = false, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-pill border px-4 text-sm font-medium transition-colors",
        selected ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-3 hover:border-line-strong",
        className,
      )}
      {...props}
    />
  );
});
