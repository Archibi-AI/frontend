import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountNav } from "@/features/account/components/account-nav";
import { Container } from "@/shared/layout/container";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <Container className="flex gap-10 py-8 md:py-12">
      <AccountNav />
      <div className="min-w-0 flex-1">{children}</div>
    </Container>
  );
}
