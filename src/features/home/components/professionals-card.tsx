import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { RemoteImage } from "@/shared/ui/remote-image";

/** ProfessionalsSection.kt: banner, headline, one line of copy, outlined red button. The whole card opens Pros. */
export function ProfessionalsCard() {
  return (
    <Link href={routes.hiring.index()} className="mt-6 block overflow-hidden rounded-xl border border-line bg-surface">
      <RemoteImage src="/web-static/brand/home/professional.jpg" alt="" className="aspect-[2.4] w-full object-cover md:aspect-auto md:h-[280px]" />
      <div className="px-4 pb-4 pt-3.5">
        <h2 className="text-[18px] font-bold text-ink-2">Bring your design to life</h2>
        <p className="mt-0.5 text-[13px] text-subtle">Find architects and contractors</p>
        <span className="mt-3.5 flex h-10 w-full items-center justify-center rounded-pill border-[1.5px] border-brand text-sm font-semibold text-brand md:w-[280px]">
          Explore professionals
        </span>
      </div>
    </Link>
  );
}
