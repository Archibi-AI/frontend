import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUuid, ProjectGrid } from "@/features/hiring";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { recallProfessional } from "@/features/hiring/server/card-cache";
import { getProfessionalsProject } from "@/features/hiring/server/repository";
import type { ProProject } from "@/features/hiring/schemas";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

type Params = Promise<{ uuid: string }>;
export const metadata: Metadata = { title: "Projects" };

/** Professional projects screen (H6, 20/page). */
export default async function ProfessionalProjectsPage({ params }: { params: Params }) {
  const { uuid } = await params;
  if (!isUuid(uuid)) notFound();
  const [projects, card] = await Promise.all([
    getProfessionalsProject(1, uuid).then((r) => r.projects).catch((e): ProProject[] => {
      if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
      throw e;
    }),
    recallProfessional(uuid),
  ]);
  const name = card?.fullname || "Professional";
  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: name, href: routes.hiring.professional(uuid) }, { label: "Projects" }]} />
      <PageHeading eyebrow="Archibi Pros" title={`${name}'s projects`} />
      <ProjectGrid uuid={uuid} initial={projects} />
    </>
  );
}
