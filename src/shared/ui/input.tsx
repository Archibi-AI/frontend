import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { FieldError } from "./field-error";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hideLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hideLabel, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className={cn("mb-1.5 block text-[13px] font-medium text-ink-2", hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-[46px] w-full rounded-sm border bg-surface px-4 text-base text-ink placeholder:text-subtle transition-colors duration-[180ms]",
          "focus:border-brand focus:shadow-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-danger" : "border-line-strong",
          className,
        )}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
});
