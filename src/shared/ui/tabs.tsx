"use client";
import * as RTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const Tabs = RTabs.Root;
export const TabsContent = RTabs.Content;

export function TabsList({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <RTabs.List aria-label={label} className={cn("flex gap-6 overflow-x-auto border-b border-line", className)}>
      {children}
    </RTabs.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RTabs.Trigger
      value={value}
      className="-mb-px h-11 shrink-0 border-b-2 border-transparent text-sm font-medium text-subtle data-[state=active]:border-brand data-[state=active]:text-ink"
    >
      {children}
    </RTabs.Trigger>
  );
}
