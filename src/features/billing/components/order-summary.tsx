import { PaywallText, formatPrice, type Period } from "../model/catalog";
import type { StripePlan } from "../schemas";

function Dots() {
  return <hr className="my-3 border-0 border-t border-dashed border-line-strong" />;
}

/** KMP "Review Order": plan name, renders per period, price between dotted rules. */
export function OrderSummary({ plan, period }: { plan: StripePlan; period?: Period }) {
  const row = "flex items-baseline justify-between gap-4 py-1 text-[15px]";
  return (
    <section aria-labelledby="order-title" className="rounded-md border-2 border-ink bg-surface p-5 md:p-6">
      <h2 id="order-title" className="text-center text-xl font-semibold text-subtle">Review Order</h2>
      <Dots />
      <div className={row}><span className="text-subtle">Plan name</span><span className="text-right font-medium text-ink-2">{plan.name}</span></div>
      <div className={row}>
        <span className="text-subtle">{`Renders every ${period ?? "month"}`}</span>
        <span className="font-medium text-ink-2">{plan.creditsCount}</span>
      </div>
      <Dots />
      <div className="flex items-baseline justify-between gap-4 py-1 text-base">
        <span className="text-subtle">Price</span>
        <span className="font-bold text-ink-2">{formatPrice(plan.amount, plan.currency)}{` / ${period ?? "month"}`}</span>
      </div>
      <p className="mt-3 text-xs text-subtle">
        {`${PaywallText.renewalLine(period ?? "month")} Manage it any time in Manage plan.`}
      </p>
    </section>
  );
}
