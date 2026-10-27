import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AiSessionProvider } from "@/features/ai";
import { Container } from "@/shared/layout/container";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AiLayout({ children }: { children: ReactNode }) {
  return (
    <AiSessionProvider>
      <Container className="py-8 md:py-12">{children}</Container>
    </AiSessionProvider>
  );
}
