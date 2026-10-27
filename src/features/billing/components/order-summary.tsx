import { FramedImage } from "@/shared/ui/framed-image";
import { PaywallText, formatPrice, rendersLabel, type Period } from "../model/catalog";
import type { StripePlan } from "../schemas";

function Dots() {
  return <hr className="my-3 border-0 border-t border-dashed border-line-strong" />;
}

/** KMP BuyCreditsScreen "Review Order": plan name, credit count, price between dotted rules. */
export function OrderSummary({ plan, kind, period }: { plan: StripePlan; kind: "credits" | "subscription"; period?: Period }) {
  const row = "flex items-baseline justify-between gap-4 py-1 text-[15px]";
  return (
    <section aria-labelledby="order-title" className="rounded-md border-2 border-ink bg-surface p-5 md:p-6">
      <h2 id="order-title" className="text-center text-xl font-semibold text-subtle">Review Order</h2>
      <Dots />
      {plan.image && kind === "credits" && <FramedImage src={plan.image} alt="" className="mb-3 h-28 rounded-md" />}
      <div className={row}><span className="text-subtle">Plan name</span><span className="text-right font-medium text-ink-2">{plan.name}</span></div>
      <div className={row}>
        <span className="text-subtle">{kind === "credits" ? "Credit count" : `Renders every ${period ?? "month"}`}</span>
        <span className="font-medium text-ink-2">{plan.creditsCount}</span>
      </div>
      <Dots />
      <div className="flex items-baseline justify-between gap-4 py-1 text-base">
        <span className="text-subtle">Price</span>
        <span className="font-bold text-ink-2">{formatPrice(plan.amount, plan.currency)}{kind === "subscription" ? ` / ${period ?? "month"}` : ""}</span>
      </div>
      <p className="mt-3 text-xs text-subtle">
        {kind === "credits" ? `${rendersLabel(plan.creditsCount)} are added as soon as your payment is confirmed. ${PaywallText.oneTimeNote}` : `${PaywallText.renewalLine(period ?? "month")} Manage it any time in Manage plan.`}
      </p>
    </section>
  );
}
