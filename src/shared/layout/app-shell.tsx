"use client";
import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";

export function AppShell({ pathname, right, children }: { pathname: string; right: ReactNode; children: ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface focus:p-2">
        Skip to content
      </a>
      <TopBar pathname={pathname} right={right} />
      <main id="main" className="min-h-[calc(100dvh-4rem)] pb-24 md:pb-12">
        {children}
      </main>
      <BottomNav pathname={pathname} />
    </>
  );
}
