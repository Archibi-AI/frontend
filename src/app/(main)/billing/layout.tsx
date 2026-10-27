import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/shared/layout/container";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BillingLayout({ children }: { children: ReactNode }) {
  return <Container className="py-8 md:py-12">{children}</Container>;
}
