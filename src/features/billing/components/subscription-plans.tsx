"use client";
import { Check, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/cn";
import { Button, buttonVariants } from "@/shared/ui/button";
import { RemoteImage } from "@/shared/ui/remote-image";
import {
  PaywallText,
  defaultPeriod,
  defaultPlanIndex,
  formatPrice,
  isCurrentOption,
  yearlyFullPrice,
  yearlySavingsPercent,
  type Period,
  type PlanGroup,
  type PlanOption,
} from "../model/catalog";
import type { MySubscription } from "../schemas";
import { PillButton, PillTrack } from "./pill-tabs";
import { PlanTitle } from "./plan-title";
import { PolicyNote } from "./policy-note";

const ROW_COLUMNS = ["", "lg:mx-auto lg:max-w-xl", "lg:grid-cols-2", "lg:grid-cols-3"];

/**
 * KMP PaywallContent → PlanTabs + PlanCard + BillingOptionCard. Below `lg`: one pill per plan and only that plan's card.
 * From `lg` up: no pills, every plan's card side by side.
 */
export function SubscriptionPlans({ groups, me }: { groups: PlanGroup[]; me: MySubscription | null }) {
  // Open on the plan the user already has, so "Current plan" is visible at once.
  const currentGroup = groups.findIndex((g) => g.options.some((o) => isCurrentOption(me, o)));
  const [index, setIndex] = useState(currentGroup >= 0 ? currentGroup : defaultPlanIndex(groups));
  if (groups.length === 0) return <p className="py-10 text-center text-base text-subtle">{PaywallText.empty}</p>;

  return (
    <div>
      {groups.length > 1 && (
        <PillTrack label="Plans" className="mb-4 lg:hidden">
          {groups.map((g, i) => (
            <PillButton key={g.name} selected={i === index} onClick={() => setIndex(i)}>{g.name}</PillButton>
          ))}
        </PillTrack>
      )}
      <div className={cn("grid gap-5", ROW_COLUMNS[Math.min(groups.length, 3)])}>
        {groups.map((group, i) => <PlanCard key={group.name} group={group} me={me} shown={i === index} />)}
      </div>
    </div>
  );
}

function PlanCard({ group, me, shown }: { group: PlanGroup; me: MySubscription | null; shown: boolean }) {
  const [chosen, setChosen] = useState<Period | undefined>(() => group.options.find((o) => isCurrentOption(me, o))?.period);
  const period = chosen ?? defaultPeriod(group.options);
  const selected = group.options.find((o) => o.period === period);
  const monthly = group.options.find((o) => o.period === "month");
  const yearly = group.options.find((o) => o.period === "year");
  const current = selected ? isCurrentOption(me, selected) : false;

  return (
    <article aria-label={group.name} className={cn("flex-col rounded-lg border border-line bg-surface p-5 shadow-card md:p-6", shown ? "flex" : "hidden lg:flex")}>
      <PlanTitle name={group.name} />
      <p className="mt-1 text-sm text-subtle">{group.shortDescription || (selected?.maxCredits ? `${selected.maxCredits} renders every ${period}` : "")}</p>
      {!group.isFree && (
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Billing period">
          {group.options.map((option) => (
            <OptionCard
              key={option.priceId}
              option={option}
              selected={option.period === period}
              savings={option.period === "year" ? yearlySavingsPercent(monthly, yearly) : null}
              fullPrice={option.period === "year" ? yearlyFullPrice(monthly, yearly) : null}
              onSelect={() => setChosen(option.period)}
            />
          ))}
        </div>
      )}
      {selected && (
        current ? (
          <Button disabled size="lg" className="mt-4 w-full rounded-pill border-track bg-track normal-case tracking-normal text-subtle disabled:opacity-100">
            <span className="text-base font-semibold">{PaywallText.currentPlan}</span>
          </Button>
        ) : (
          <Link href={routes.billing.checkout("subscription", selected.priceId)} className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full rounded-pill normal-case tracking-normal")}>
            <span className="text-base font-semibold">{PaywallText.upgradeTo(group.name)}</span>
          </Link>
        )
      )}
      {selected && <p className="mt-3 text-center text-xs text-subtle">{PaywallText.renewalLine(selected.period)}</p>}
      {!group.isFree && <div className="mt-2"><PolicyNote /></div>}
      {group.features.length > 0 && (
        <ul className="mt-4">
          {group.features.map((f) => <FeatureRow key={f.uuid} title={f.title} iconUrl={f.iconUrl} />)}
        </ul>
      )}
    </article>
  );
}

/** PlanFeatureRow: the feature's 22 px icon, or the outlined check when it has none or it fails to load. */
function FeatureRow({ title, iconUrl }: { title: string; iconUrl: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="flex items-center gap-3.5 py-2 text-base text-[#585858]">
      {!iconUrl || failed ? <CircleCheck className="size-[22px] shrink-0" aria-hidden /> : <RemoteImage src={iconUrl} alt="" onError={() => setFailed(true)} className="size-[22px] shrink-0 object-contain" />}
      {title}
    </li>
  );
}

function OptionCard({ option, selected, savings, fullPrice, onSelect }: { option: PlanOption; selected: boolean; savings: number | null; fullPrice: string | null; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn("flex flex-col rounded-md border p-4 text-left transition-colors", selected ? "border-2 border-brand bg-brand/5" : "border-line bg-surface hover:border-line-strong")}
    >
      <span className="flex w-full items-center justify-between">
        {selected ? (
          <span className="flex size-[22px] items-center justify-center rounded-pill bg-brand text-white"><Check className="size-3.5" aria-hidden /></span>
        ) : (
          <span className="size-[22px] rounded-pill border-[1.5px] border-line-strong" aria-hidden />
        )}
        {savings !== null && <span className="rounded-pill bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">{PaywallText.savePercent(savings)}</span>}
      </span>
      <span className="mt-3 text-lg font-bold text-ink-2">{formatPrice(option.amount, option.currency)}</span>
      {fullPrice && <span className="text-[13px] text-line-strong line-through">{fullPrice}</span>}
      <span className="mt-0.5 text-[13px] text-subtle">{PaywallText.billedCaption(option.period)}</span>
    </button>
  );
}
