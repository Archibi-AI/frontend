import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-6", className)}>{children}</div>;
}
