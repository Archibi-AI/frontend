import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/features/ai";
import { isUuid } from "@/features/hiring";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Your design" };

export default async function ResultPage({ params }: { params: Promise<{ projectUuid: string }> }) {
  const { projectUuid } = await params;
  if (!isUuid(projectUuid)) notFound();
  return (
    <>
      <PageHeading eyebrow="Archibi AI" title="Your design" />
      <ResultView projectUuid={projectUuid} />
    </>
  );
}
