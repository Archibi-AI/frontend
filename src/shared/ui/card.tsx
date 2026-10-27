import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export function Card({ className, variant = "raised", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: "flat" | "raised" }) {
  return (
    <div
      className={cn("rounded-md bg-surface", variant === "raised" ? "shadow-card" : "border border-line", className)}
      {...props}
    />
  );
}
