import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-[13px] font-bold uppercase tracking-[.02em] transition-colors duration-[180ms] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-brand bg-brand text-white hover:border-brand-strong hover:bg-brand-strong",
        secondary: "border-ink bg-transparent text-ink hover:border-brand hover:text-brand",
        "secondary-dark": "border-white/55 bg-transparent text-white hover:border-brand hover:text-brand",
        ghost: "border-transparent bg-transparent text-ink hover:text-brand",
        danger: "border-danger bg-danger text-white hover:brightness-110",
      },
      size: { sm: "h-9 px-4 text-[12px]", md: "h-[46px] px-6", lg: "h-[50px] px-8" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
