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
      <label htmlFor={inputId} className={cn("mb-1 block text-sm font-medium text-ink-2", hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-11 w-full rounded-sm border bg-surface px-3 text-base text-ink placeholder:text-subtle",
          error ? "border-danger" : "border-line focus:border-brand",
          className,
        )}
        {...props}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
});
