import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid, HiringTabs, hiringTypeLabel, parseHiringType } from "@/features/hiring";
import { getMainMenuCategories, getMainMenuHeader } from "@/features/hiring/server/repository";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";
import { RemoteImage } from "@/shared/ui/remote-image";

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
      {header && (
        <section className="relative mb-8 overflow-hidden bg-ink">
          <RemoteImage src={header.imageHeader} alt="" loading="eager" className="absolute inset-0 size-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" aria-hidden />
          <div className="relative flex min-h-56 flex-col justify-end gap-4 p-6 md:min-h-72 md:p-10">
            <h1 className="max-w-2xl font-display text-3xl font-medium leading-tight text-white md:text-4xl">{header.titleHeader}</h1>
            {header.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {header.tags.map((t) => (
                  <li key={t}>
                    <Link href={routes.hiring.tag(t)} className="inline-flex h-9 items-center rounded-pill border border-white/40 px-4 text-sm font-medium text-white backdrop-blur hover:bg-white/15">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
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
      <HiringTabs type={type} />
      <CategoryGrid categories={categories} section={type} />
    </>
  );
}
