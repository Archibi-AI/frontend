import { routes, type BillingSection } from "@/shared/config/routes";
import { PaywallText, rendersLabel, type PlanGroup } from "../model/catalog";
import type { MySubscription, StripePlan } from "../schemas";
import { CreditPackCard } from "./credit-pack-card";
import { EnterpriseCard } from "./enterprise-card";
import { PillLink, PillTrack } from "./pill-tabs";
import { SubscriptionPlans } from "./subscription-plans";

const TABS: Array<{ section: BillingSection; label: string }> = [
  { section: "all", label: "All" },
  { section: "credits", label: "Renders" },
  { section: "subscriptions", label: "Subscriptions" },
];

export interface PaywallProps {
  section: BillingSection;
  /** null = the credit-pack catalogue could not be loaded. */
  packs: StripePlan[] | null;
  /** null = the subscription catalogue could not be loaded; `unavailable` = the rollout gate is closed (403). */
  groups: PlanGroup[] | null;
  subscriptionsUnavailable: boolean;
  me: MySubscription | null;
  userCredits: number;
}

/** The in-app paywall (KMP PaywallContent + OneTimePackCard grid): hero, section pills, the cards, the enterprise card. */
export function Paywall({ section, packs, groups, subscriptionsUnavailable, me, userCredits }: PaywallProps) {
  const showSubs = section !== "credits";
  const showPacks = section !== "subscriptions";
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

      <PillTrack label="Sections">
        {TABS.map((t) => (
          <PillLink key={t.section} href={routes.billing.index(t.section)} selected={t.section === section}>{t.label}</PillLink>
        ))}
      </PillTrack>

      {showSubs && (
        <section aria-labelledby="subs-title" className="max-w-3xl">
          <h2 id="subs-title" className="mb-4 font-display text-xl font-medium text-ink-2">Subscriptions</h2>
          {subscriptionsUnavailable ? (
            <p className="rounded-md border border-line bg-surface px-4 py-6 text-center text-[15px] text-subtle">{PaywallText.unavailable}</p>
          ) : groups === null ? (
            <p role="alert" className="rounded-md border border-danger px-4 py-3 text-sm text-danger">Something went wrong. Please try again.</p>
          ) : (
            <SubscriptionPlans groups={groups} me={me} />
          )}
        </section>
      )}

      {showPacks && (
        <section aria-labelledby="packs-title">
          <h2 id="packs-title" className="mb-4 font-display text-xl font-medium text-ink-2">Renders</h2>
          {packs === null ? (
            <p role="alert" className="rounded-md border border-danger px-4 py-3 text-sm text-danger">Something went wrong. Please try again.</p>
          ) : packs.length === 0 ? (
            <p className="py-6 text-center text-base text-subtle">No render packs available right now.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {packs.map((pack) => <CreditPackCard key={pack.priceId} pack={pack} />)}
            </div>
          )}
        </section>
      )}

      <div className="max-w-3xl"><EnterpriseCard /></div>
    </div>
  );
}
