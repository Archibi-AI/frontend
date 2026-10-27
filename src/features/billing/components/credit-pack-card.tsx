import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/button";
import { FramedImage } from "@/shared/ui/framed-image";
import { PaywallText, formatPrice, rendersLabel } from "../model/catalog";
import type { StripePlan } from "../schemas";
import { PlanTitle } from "./plan-title";
import { PolicyNote } from "./policy-note";

/** KMP OneTimePackCard: the paywall card without the monthly/yearly choice — there is nothing to renew. */
export function CreditPackCard({ pack }: { pack: StripePlan }) {
  const badge = typeof pack.badge === "string" ? pack.badge : "";
  return (
    <article className="flex flex-col rounded-lg border border-line bg-surface p-5 shadow-card">
      {pack.image && <FramedImage src={pack.image} alt="" className="mb-4 h-32 rounded-md" />}
      <PlanTitle name={pack.name} />
      <div className="mt-4 rounded-md border-2 border-brand bg-brand/5 p-4">
        <div className="flex items-center justify-between gap-2 text-lg font-bold text-ink-2">
          <span>{rendersLabel(pack.creditsCount)}</span>
          <span>{formatPrice(pack.amount, pack.currency)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-subtle">
          <span>{PaywallText.oneTimeCaption}</span>
          {badge && <span className="rounded-pill bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">{badge}</span>}
        </div>
      </div>
      <Link href={routes.billing.checkout("credits", pack.priceId)} className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full rounded-pill normal-case tracking-normal")}>
        <span className="text-base font-semibold">{PaywallText.checkout}</span>
      </Link>
      <p className="mt-3 text-center text-xs text-subtle">{PaywallText.oneTimeNote}</p>
      <div className="mt-2"><PolicyNote /></div>
    </article>
  );
}
