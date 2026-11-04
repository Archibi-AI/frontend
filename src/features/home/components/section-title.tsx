import { ChevronRight } from "lucide-react";
import Link from "next/link";

/** HomeSectionTitle.kt: 18 px bold title, optional red 13 px action with a chevron. */
export function SectionTitle({ title, actionLabel, actionHref }: { title: string; actionLabel: string; actionHref: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <h2 className="text-[18px] font-bold text-ink-2">{title}</h2>
      <Link href={actionHref} className="flex items-center rounded-lg py-1 pl-2 text-[13px] font-semibold text-brand hover:underline">
        {actionLabel}
        <ChevronRight className="size-[18px]" aria-hidden />
      </Link>
    </div>
  );
}

/** HomeSectionDivider: the hairline between two sections. */
export function SectionDivider() {
  return <hr className="mt-6 border-line" />;
}

/** Sideways row: the app's phone layout, five cards across from `md` up. Bleeds to the screen edge on phones. */
export const ROW = "-mx-4 flex gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 md:[scrollbar-width:thin]";
export const ROW_ITEM_MD = "md:w-[calc((100%-3rem)/5)]";
