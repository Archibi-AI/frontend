"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/features/auth";
import { routes } from "@/shared/config/routes";
import { AppShell } from "@/shared/layout/app-shell";
import { UserMenu } from "@/shared/layout/user-menu";

/** Wires session state into the presentational shell (shared/ cannot import features/). */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, user } = useSession();
  return (
    <AppShell pathname={pathname} right={<UserMenu status={status} user={user} signInHref={routes.auth.login(pathname)} />}>
      {children}
    </AppShell>
  );
}
