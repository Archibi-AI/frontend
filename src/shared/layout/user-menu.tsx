"use client";
import * as Menu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Avatar } from "@/shared/ui/avatar";
import { buttonVariants } from "@/shared/ui/button";

export interface ShellUser { username: string; email: string; imageUri: string }

export function UserMenu({ status, user, signInHref }: { status: "loading" | "authenticated" | "anonymous"; user: ShellUser | null; signInHref: string }) {
  if (status === "loading") return <span className="size-9" aria-hidden />;
  if (!user) {
    return (
      <Link href={signInHref} className={buttonVariants({ size: "sm" })}>
        Sign in
      </Link>
    );
  }
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Account menu" className="rounded-pill">
        <Avatar src={user.imageUri || null} name={user.username} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={8} className="z-50 min-w-48 rounded-md bg-surface p-1 shadow-pop">
          <Menu.Label className="px-3 py-2 text-xs text-subtle">{user.email}</Menu.Label>
          {[
            { href: routes.account.index(), label: "Account" },
            { href: routes.account.managePlan(), label: "Manage plan" },
          ].map((i) => (
            <Menu.Item key={i.href} asChild>
              <Link href={i.href} className="block rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-alt">
                {i.label}
              </Link>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
