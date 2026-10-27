"use client";
import * as RToast from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type Kind = "info" | "success" | "error";
interface ToastItem { id: number; kind: Kind; title: string; description?: string }
type ToastFn = (t: Omit<ToastItem, "id">) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback<ToastFn>((t) => setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]), []);
  return (
    <ToastContext.Provider value={toast}>
      <RToast.Provider swipeDirection="up" duration={4000}>
        {children}
        {items.map((t) => (
          <RToast.Root
            key={t.id}
            onOpenChange={(open) => !open && setItems((prev) => prev.filter((x) => x.id !== t.id))}
            className={cn(
              "rounded-md border bg-surface p-4 shadow-pop",
              t.kind === "error" && "border-danger",
              t.kind === "success" && "border-success",
              t.kind === "info" && "border-line",
            )}
          >
            <RToast.Title className="text-sm font-bold text-ink-2">{t.title}</RToast.Title>
            {t.description && <RToast.Description className="mt-1 text-sm text-muted">{t.description}</RToast.Description>}
          </RToast.Root>
        ))}
        <RToast.Viewport className="fixed left-1/2 top-4 z-[60] flex w-[min(420px,92vw)] -translate-x-1/2 flex-col gap-2 outline-none md:left-auto md:right-4 md:translate-x-0" />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
