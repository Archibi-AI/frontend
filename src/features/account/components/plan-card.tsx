import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { buttonVariants } from "@/shared/ui/button";
import { formatDate } from "@/shared/lib/format";
import { isFreePlan, planStatusLine, rendersLine, topUpExpiryLine } from "../model/summary";
import type { AccountSummary } from "../schemas";

/** "Plan & Billing" — red brand card (same gradient as the account header), white allowance bar. */
export function PlanCard({ summary }: { summary: AccountSummary }) {
  const { plan, topUp } = summary;
  const used = plan.rendersAllowance > 0 ? Math.min(100, Math.round((plan.rendersRemaining / plan.rendersAllowance) * 100)) : 0;
  const status = planStatusLine(plan);
  return (
    <section aria-labelledby="plan-title" className="mb-8 overflow-hidden rounded-md bg-gradient-to-br from-brand-strong via-brand to-brand-bright text-white shadow-sm">
      <div className="p-6">
        <p className="eyebrow mb-3 !text-white/90">
          <span className="eyebrow-rule !border-white" aria-hidden />
          Plan &amp; Billing
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="plan-title" className="font-display text-2xl font-medium">{plan.name}</h2>
            {plan.status && <span className="mt-1 inline-block rounded-pill border border-white/50 px-3 py-0.5 text-xs capitalize text-white">{plan.status}</span>}
          </div>
          <p className="text-right text-sm text-white/90">{status}</p>
        </div>
        <p className="mt-5 text-[15px]">{rendersLine(plan)}</p>
        {plan.rendersAllowance > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-black/25" role="progressbar" aria-valuenow={plan.rendersRemaining} aria-valuemin={0} aria-valuemax={plan.rendersAllowance} aria-label="Renders remaining">
            <div className="h-full bg-white" style={{ width: `${used}%` }} />
          </div>
        )}
        {topUp && topUp.rendersRemaining > 0 && (
          <div className="mt-5 border-t border-white/25 pt-4">
            <p className="text-sm">
              <span className="font-bold">{topUp.rendersRemaining}</span> top-up renders
              {topUp.nextExpiry && <span className="text-white/80"> · {topUpExpiryLine(topUp)}</span>}
            </p>
            {topUp.lots.length > 0 && (
              <details className="mt-2 text-sm text-white/90">
                <summary className="cursor-pointer text-white/80 hover:text-white">Details</summary>
                <ul className="mt-2 space-y-1">
                  {topUp.lots.map((lot, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span>{lot.rendersRemaining} from {lot.source}</span>
                      <span className="text-white/80">{lot.expiresOn ? `expires ${formatDate(lot.expiresOn)}` : ""}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-white/20 bg-black/20 px-6 py-4">
        <Link href={routes.account.managePlan()} className={buttonVariants({ variant: "secondary-dark", size: "sm", className: "hover:border-white hover:bg-white hover:text-brand" })}>
          Manage plan
        </Link>
        {(plan.canUpgrade || isFreePlan(plan)) && (
          <Link href={routes.billing.index("subscriptions")} className={buttonVariants({ size: "sm", className: "border-white bg-white text-brand hover:bg-brand-tint hover:text-brand-strong" })}>
            Upgrade
          </Link>
        )}
        <Link href={routes.billing.index("credits")} className={buttonVariants({ variant: "secondary-dark", size: "sm", className: "hover:border-white hover:bg-white hover:text-brand" })}>
          Buy renders
        </Link>
      </div>
    </section>
  );
}
