"use client";
import * as RDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;
export const DialogTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <RDialog.Title className={cn("font-display text-xl font-bold text-ink-2", className)}>{children}</RDialog.Title>
);
export const DialogDescription = RDialog.Description;

const sizes = { sm: "md:max-w-md", md: "md:max-w-xl", lg: "md:max-w-4xl", full: "md:max-w-[min(1200px,95vw)]" } as const;

/** Centered dialog ≥ md, bottom sheet < md (CSS only). The red close button mirrors the app's shared close button. */
export function DialogContent({ children, size = "md", className, closeLabel = "Close" }: {
  children: ReactNode;
  size?: keyof typeof sizes;
  className?: string;
  closeLabel?: string;
}) {
  return (
    <RDialog.Portal>
      <RDialog.Overlay className="fixed inset-0 z-40 bg-ink/50" />
      <RDialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-lg bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-pop",
          "md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg",
          sizes[size],
          className,
        )}
      >
        {children}
        <RDialog.Close aria-label={closeLabel} className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-pill bg-brand text-white">
          <X className="size-5" aria-hidden />
        </RDialog.Close>
      </RDialog.Content>
    </RDialog.Portal>
  );
}
