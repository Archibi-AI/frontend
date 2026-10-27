import type { Metadata } from "next";
import { ProjectsGrid } from "@/features/account/components/projects-grid";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "My Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeading eyebrow="Account" title="My Projects" subtitle="Everything you've designed with Archibi AI — in the app and on the web." />
      <ProjectsGrid />
    </>
  );
}
