import { PaywallText, rendersLabel, type PlanGroup } from "../model/catalog";
import type { MySubscription } from "../schemas";
import { EnterpriseCard } from "./enterprise-card";
import { SubscriptionPlans } from "./subscription-plans";

export interface PaywallProps {
  /** null = the subscription catalogue could not be loaded; `unavailable` = the rollout gate is closed (403). */
  groups: PlanGroup[] | null;
  subscriptionsUnavailable: boolean;
  me: MySubscription | null;
  userCredits: number;
}

/** The web paywall sells subscriptions only (no render packs): hero, the plan cards, the enterprise card. */
export function Paywall({ groups, subscriptionsUnavailable, me, userCredits }: PaywallProps) {
  const sub = me?.subscription;
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-md bg-gradient-to-br from-brand-strong via-brand to-brand-bright p-6 text-white shadow-sm md:p-8">
        <p className="eyebrow mb-3 !text-white/90">
          <span className="eyebrow-rule !border-white" aria-hidden />
          Plans &amp; Billing
        </p>
        <h1 className="font-display text-[26px] font-medium leading-tight md:text-[32px]">{PaywallText.title}</h1>
        <p className="mt-2 text-[15px] text-white/90">{PaywallText.subtitle}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-pill border border-white/50 px-3 py-1">{rendersLabel(userCredits)} available</span>
          {sub?.isEntitled && sub.plan && <span className="rounded-pill border border-white/50 px-3 py-1">{sub.plan.name} · {sub.status}</span>}
        </div>
      </section>

      <section aria-labelledby="subs-title">
        <h2 id="subs-title" className="mb-4 font-display text-xl font-medium text-ink-2">Subscriptions</h2>
        {subscriptionsUnavailable ? (
          <p className="rounded-md border border-line bg-surface px-4 py-6 text-center text-[15px] text-subtle">{PaywallText.unavailable}</p>
        ) : groups === null ? (
          <p role="alert" className="rounded-md border border-danger px-4 py-3 text-sm text-danger">Something went wrong. Please try again.</p>
        ) : (
          <SubscriptionPlans groups={groups} me={me} />
        )}
      </section>

      <EnterpriseCard />
    </div>
  );
}
