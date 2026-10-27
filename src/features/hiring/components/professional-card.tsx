import { MapPin } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Avatar } from "@/shared/ui/avatar";
import type { ProfessionalSimple } from "../schemas";
import { WishlistButton } from "./wishlist-button";

/** ProfessionalSimpleViewDC card: avatar, name, profession, location, two-line about, wishlist heart. */
export function ProfessionalCard({ pro }: { pro: ProfessionalSimple }) {
  const name = pro.fullname || "Professional";
  return (
    <article className="relative flex gap-4 border border-line bg-surface p-4 transition-shadow hover:shadow-md">
      <Avatar src={pro.image} name={name} className="size-16 shrink-0 text-lg" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-medium text-ink-2">
          <Link href={routes.hiring.professional(pro.uuid)} className="after:absolute after:inset-0">
            {name}
          </Link>
        </h3>
        {pro.profession && <p className="text-sm text-ink-3">{pro.profession}</p>}
        {pro.location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
            <MapPin className="size-3.5" aria-hidden />
            {pro.location}
          </p>
        )}
        {pro.about && <p className="mt-2 line-clamp-2 text-sm text-muted">{pro.about}</p>}
      </div>
      <div className="relative z-10 -mr-2 -mt-2 shrink-0">
        <WishlistButton uuid={pro.uuid} initial={pro.isWishedList} />
      </div>
    </article>
  );
}
