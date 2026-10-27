import type { Metadata } from "next";
import { ServiceHub } from "@/features/ai";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "AI Design Studio" };

export default function AiHubPage() {
  return (
    <>
      <PageHeading eyebrow="Archibi AI" title="AI Design Studio" />
      <ServiceHub />
    </>
  );
}
