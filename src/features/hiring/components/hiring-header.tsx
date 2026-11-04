import { Heart } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { RemoteImage } from "@/shared/ui/remote-image";
import type { HiringHeader as Header } from "../schemas";

const tagRows = (tags: readonly string[]) => [tags.filter((_, i) => i % 2 === 0), tags.filter((_, i) => i % 2 === 1)];

/** Phones: the app's header (header.kt + HiringMainMenu.kt). Larger screens: the banner with the title and tags over it. */
export function HiringHeader({ header }: { header: Header }) {
  return (
    <>
      <PhoneHeader header={header} />
      <section className="relative mb-8 hidden overflow-hidden bg-ink md:block">
        <RemoteImage src={header.imageHeader} alt="" className="absolute inset-0 size-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" aria-hidden />
        <div className="relative flex min-h-72 flex-col justify-end gap-4 p-10">
          <h1 className="max-w-2xl font-display text-4xl font-medium leading-tight text-white">{header.titleHeader}</h1>
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
    </>
  );
}

/** 140 px banner, "Are You a Professional?" + Join Us Now!, "Popular Tags" over two rows that scroll sideways. */
function PhoneHeader({ header }: { header: Header }) {
  return (
    <section data-testid="hiring-phone-header" className="-mx-4 -mt-8 mb-1.5 md:hidden">
      <h1 className="sr-only">{header.titleHeader}</h1>
      <RemoteImage src={header.imageHeader} alt="" className="h-[140px] w-full object-cover" />
      <div className="flex items-center gap-3 px-3 pb-1 pt-2.5">
        <p className="text-base font-semibold text-gray-500">Are You a Professional?</p>
        <a href={routes.professionalsPanel} target="_blank" rel="noopener noreferrer" className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-pill bg-[#585858] text-base font-bold text-white shadow-md">
          Join Us Now!
        </a>
      </div>
      <div className="flex items-baseline justify-between px-2.5 py-2.5">
        <h2 className="text-[20px] text-[#444]">Popular Tags</h2>
        <Link href={routes.hiring.wishlist()} className="inline-flex items-center gap-1.5 text-[15px] text-gray-500">
          <Heart className="size-4" aria-hidden /> My wishlist
        </Link>
      </div>
      <hr className="mb-2.5 border-t-[0.5px] border-gray-500" />
      {header.tags.length > 0 && (
        <div className="space-y-1 overflow-x-auto px-1.5 pb-1 [scrollbar-width:none]">
          {tagRows(header.tags).map((row, i) => (
            <ul key={i} className="flex w-max gap-1.5">
              {row.map((t) => (
                <li key={t}>
                  <Link href={routes.hiring.tag(t)} className="inline-flex h-10 items-center whitespace-nowrap rounded-pill border border-[#585858] bg-surface px-5 text-xs font-semibold text-[#585858]">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      )}
    </section>
  );
}
