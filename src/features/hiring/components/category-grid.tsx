import { Briefcase } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { EmptyState } from "@/shared/ui/empty-state";
import { RemoteImage } from "@/shared/ui/remote-image";
import type { HiringCategory } from "../schemas";

/** Category cards 2/3/4 columns; tap → hiring/categories/{title}/{section}/{uuid}. */
export function CategoryGrid({ categories, section }: { categories: HiringCategory[]; section: string }) {
  if (categories.length === 0) return <EmptyState icon={<Briefcase className="size-10 text-subtle" aria-hidden />} title="No categories yet." />;
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <li key={c.uuid}>
          <Link href={routes.hiring.category(c.title, section, c.uuid)} className="group block overflow-hidden border border-line bg-surface transition-shadow hover:shadow-md">
            <div className="aspect-[4/3] bg-track">
              {c.image && <RemoteImage src={c.image} alt="" className="size-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.03]" />}
            </div>
            <p className="px-4 py-3 font-display text-sm font-medium text-ink-2">{c.title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
