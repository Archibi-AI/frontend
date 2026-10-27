"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { Container } from "./container";
import { isActive, PRIMARY_NAV } from "./nav";

export function TopBar({ pathname, right }: { pathname: string; right: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-8">
        <a href={routes.wordpress.home} className="font-display text-xl font-bold tracking-tight text-brand">
          Archibi
        </a>
        <nav aria-label="Primary" className="hidden flex-1 gap-6 md:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.match) ? "page" : undefined}
              className={cn("text-sm font-medium", isActive(pathname, item.match) ? "text-brand" : "text-ink-3 hover:text-ink")}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </Container>
    </header>
  );
}
