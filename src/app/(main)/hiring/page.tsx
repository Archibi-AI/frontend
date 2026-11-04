import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid, HiringHeader, HiringTabs, hiringTypeLabel, parseHiringType } from "@/features/hiring";
import { getMainMenuCategories, getMainMenuHeader } from "@/features/hiring/server/repository";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export const metadata: Metadata = {
  title: "Find architects, designers and contractors",
  description: "Hire vetted architects, interior designers, constructors and landscape professionals on Archibi Pros.",
};

/** Mirrors HiringMainMenu (hire_main_menu): header banner + popular tags (H1), tabs, category grid (H2). */
export default async function HiringPage({ searchParams }: { searchParams: SearchParams }) {
  const type = parseHiringType(first((await searchParams).type));
  const [header, categories] = await Promise.all([getMainMenuHeader().catch(() => null), getMainMenuCategories(type)]);

  return (
    <>
      {header && <HiringHeader header={header} />}
      <div className="hidden md:block">
      <PageHeading
        eyebrow="Archibi Pros"
        title={`${hiringTypeLabel(type)} professionals`}
        subtitle="Browse a category to meet the people behind the projects."
        action={
          <Link href={routes.hiring.wishlist()} className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
            <Heart className="size-4" aria-hidden /> My wishlist
          </Link>
        }
      />
      </div>
      <HiringTabs type={type} />
      <CategoryGrid categories={categories} section={type} />
    </>
  );
}
