import type { Metadata } from "next";
import { decodeSelection, FilterPanel, ProfessionalList, toApiFilters } from "@/features/hiring";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getTagProfessionals, getUserFilters } from "@/features/hiring/server/repository";
import type { ProfessionalSimple } from "@/features/hiring/schemas";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

type Params = Promise<{ tag: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).tag)} professionals` };
}

/** Tag screen (hiring/tags/{tag}): professionals (H4) + filters (H9 with ?tag=). */
export default async function TagPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const tag = decodeURIComponent((await params).tag).slice(0, 80);
  const selection = decodeSelection(first((await searchParams).filters));
  const defs = await getUserFilters({ tag }).then((r) => r.filters).catch(() => []);
  const filtersJson = toApiFilters(defs, selection);
  const apiFilters = filtersJson === "[]" ? undefined : filtersJson;
  const pros = await getTagProfessionals(tag, 1, apiFilters, undefined)
    .then((r) => r.professionals)
    .catch((e): ProfessionalSimple[] => {
      if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
      throw e;
    });
  await rememberProfessionals(pros);

  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: `#${tag}` }]} />
      <PageHeading eyebrow="Archibi Pros" title={tag} subtitle="Professionals tagged with this specialty." />
      <FilterPanel scope={{ tag }} selection={selection} pathname={routes.hiring.tag(tag)} />
      <ProfessionalList
        keyParts={["tag", tag, apiFilters ?? ""]}
        path="/bff/hiring/tag/professionals"
        query={{ tag, filters: apiFilters }}
        initial={pros}
        empty="No professional found for this tag and these filters!"
      />
    </>
  );
}
