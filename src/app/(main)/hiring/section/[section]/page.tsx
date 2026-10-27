import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryGrid, hiringTypeLabel, HIRING_TYPES } from "@/features/hiring";
import { getMainMenuCategories } from "@/features/hiring/server/repository";
import { routes } from "@/shared/config/routes";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { PageHeading } from "@/shared/layout/page-heading";

type Params = Promise<{ section: string }>;
const resolve = (s: string) => HIRING_TYPES.find((t) => t.value === decodeURIComponent(s).toLowerCase())?.value;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const type = resolve((await params).section);
  return { title: type ? `${hiringTypeLabel(type)} professionals` : "Professionals" };
}

/** Section screen (hiring/sections/{section}): every category of one professional type (H2). */
export default async function SectionPage({ params }: { params: Params }) {
  const type = resolve((await params).section);
  if (!type) notFound();
  const categories = await getMainMenuCategories(type);
  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: hiringTypeLabel(type) }]} />
      <PageHeading eyebrow="Archibi Pros" title={hiringTypeLabel(type)} subtitle="All categories in this section." />
      <CategoryGrid categories={categories} section={type} />
    </>
  );
}
