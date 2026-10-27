"use client";
import { CreditCard, Heart, Folder, Lock, LifeBuoy, Receipt, ShieldCheck, User, Bookmark, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";

const ITEMS: ReadonlyArray<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: routes.account.index(), label: "Overview", Icon: User },
  { href: routes.account.projects(), label: "My Projects", Icon: Folder },
  { href: routes.account.favoriteIdeas(), label: "Favorite Ideas", Icon: Bookmark },
  { href: routes.hiring.wishlist(), label: "Favorite Pros", Icon: Heart },
  { href: routes.account.transactions(), label: "Transactions", Icon: Receipt },
  { href: routes.account.managePlan(), label: "Manage plan", Icon: CreditCard },
  { href: routes.account.edit(), label: "Edit profile", Icon: User },
  { href: routes.account.changePassword(), label: "Change password", Icon: Lock },
  { href: routes.account.privacy(), label: "Privacy & Data", Icon: ShieldCheck },
  { href: routes.account.support(), label: "Support", Icon: LifeBuoy },
];

/** Desktop side navigation (≥ lg); on phones the overview rows are the navigation. */
export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="hidden w-60 shrink-0 lg:block">
      <ul className="sticky top-24 space-y-1">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 border-l-2 px-4 text-[14px] font-medium transition-colors",
                  active ? "border-brand bg-brand-tint text-brand" : "border-transparent text-ink-3 hover:bg-surface-alt",
                )}
              >
                <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
