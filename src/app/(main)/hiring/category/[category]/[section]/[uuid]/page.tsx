import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decodeSelection, FilterPanel, hiringTypeLabel, HIRING_TYPES, isCategoryId, ProfessionalList, toApiFilters } from "@/features/hiring";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getCategoryProfessionals, getUserFilters } from "@/features/hiring/server/repository";
import type { ProfessionalSimple } from "@/features/hiring/schemas";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

type Params = Promise<{ category: string; section: string; uuid: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const title = decodeURIComponent((await params).category);
  return { title: `${title} professionals` };
}

/** Category screen: professionals (H3, 20/page) + filters (H9). `?filters=` is the shareable selection. */
export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { category, section, uuid } = await params;
  if (!isCategoryId(uuid)) notFound();
  const title = decodeURIComponent(category);
  const type = HIRING_TYPES.find((t) => t.value === decodeURIComponent(section).toLowerCase())?.value;
  const encoded = first((await searchParams).filters);
  const selection = decodeSelection(encoded);

  const defs = await getUserFilters({ category: uuid }).then((r) => r.filters).catch(() => []);
  const filtersJson = toApiFilters(defs, selection);
  const apiFilters = filtersJson === "[]" ? undefined : filtersJson;
  const pros = await getCategoryProfessionals(uuid, 1, apiFilters, undefined)
    .then((r) => r.professionals)
    .catch((e): ProfessionalSimple[] => {
      if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
      throw e;
    });
  await rememberProfessionals(pros);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Pros", href: routes.hiring.index() },
          ...(type ? [{ label: hiringTypeLabel(type), href: routes.hiring.section(type) }] : []),
          { label: title },
        ]}
      />
      <PageHeading eyebrow="Archibi Pros" title={title} />
      <FilterPanel scope={{ category: uuid }} selection={selection} pathname={routes.hiring.category(title, section, uuid)} />
      <ProfessionalList
        keyParts={["category", uuid, apiFilters ?? ""]}
        path="/bff/hiring/category/professionals"
        query={{ category: uuid, filters: apiFilters }}
        initial={pros}
        empty="No professional found for this category and these filters!"
      />
    </>
  );
}
