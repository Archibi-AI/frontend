import { Briefcase } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";
import { FramedImage } from "@/shared/ui/framed-image";
import type { HiringCategory } from "../schemas";

/** Category cards 2/3/4 columns; tap → hiring/categories/{title}/{section}/{uuid}. */
export function CategoryGrid({ categories, section }: { categories: HiringCategory[]; section: string }) {
  if (categories.length === 0) return <EmptyState icon={<Briefcase className="size-10 text-subtle" aria-hidden />} title="No categories yet." />;
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <li key={c.uuid}>
          <Link href={routes.hiring.category(c.title, section, c.uuid)} className="group block overflow-hidden border border-line bg-surface transition-shadow hover:shadow-md">
            <FramedImage src={c.image} alt="" className="aspect-[4/3]" />
            {/* Fixed height for two lines, so every card in the grid is the same height. */}
            <p className="flex h-16 items-center justify-center px-3 text-center font-display text-sm font-medium leading-snug text-ink-2"><span className="line-clamp-2">{c.title}</span></p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
