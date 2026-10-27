import type { ReactNode } from "react";
import { Container } from "@/shared/layout/container";

export default function HiringLayout({ children }: { children: ReactNode }) {
  return <Container className="py-8 md:py-12">{children}</Container>;
}
