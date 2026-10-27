"use client";
import { FolderOpen, Lightbulb, Sparkles, User, Users } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { isActive } from "./nav";

const TABS = [
  { href: routes.ideabank.index(), label: "Ideas", match: "/ideabank", Icon: Lightbulb },
  { href: routes.account.projects(), label: "Projects", match: "/account/projects", Icon: FolderOpen },
  { href: routes.ai.index(), label: "AI", match: "/ai", Icon: Sparkles, center: true },
  { href: routes.hiring.index(), label: "Pros", match: "/hiring", Icon: Users },
  { href: routes.account.index(), label: "Account", match: "/account", Icon: User },
] as const;

/** < md only. Re-clicking the active tab does nothing (KMP DoubleTapGuard / navigateToTab). */
export function BottomNav({ pathname }: { pathname: string }) {
  const activeHref = TABS.filter((t) => isActive(pathname, t.match)).sort((a, b) => b.match.length - a.match.length)[0]?.href;
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon, ...t }) => {
          const active = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(e: MouseEvent) => active && e.preventDefault()}
                className={cn("flex h-16 flex-col items-center justify-center gap-1 text-xs", active ? "text-brand" : "text-subtle")}
              >
                <span className={cn("inline-flex", "center" in t && t.center && "rounded-pill bg-brand p-2 text-white")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
