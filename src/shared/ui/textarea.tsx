import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { FieldError } from "./field-error";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(
  function Textarea({ label, error, className, id, ...props }, ref) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="w-full">
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-ink-2">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn("min-h-28 w-full rounded-sm border bg-surface p-3 text-base", "focus:border-brand focus:shadow-focus focus:outline-none", error ? "border-danger" : "border-line-strong", className)}
          {...props}
        />
        <FieldError id={`${fieldId}-error`} message={error} />
      </div>
    );
  },
);
