import type { MySubscription, StripePlan, SubscriptionPlan } from "../schemas";

/** Verbatim from KMP PaywallText / OutOfRendersText — copy edits never touch layout. */
export const PaywallText = {
  title: "For people who design every day",
  subtitle: "Choose the right plan for you",
  currentPlan: "Current plan",
  empty: "No subscription plans available right now.",
  unavailable: "Subscriptions are not available yet. Please check back soon.",
  processing: "Your subscription is being activated. Credits will appear shortly.",
  enterpriseTitle: "Are you an enterprise? Contact us",
  enterpriseBody: "To buy more credits and features for your team, contact us with the button below.",
  enterpriseButton: "Contact us",
  enterpriseError: "We couldn't open the contact page. Please try again.",
  enterpriseUnset: "Contact us at support@archibi.ca",
  oneTimeCaption: "One-time purchase",
  oneTimeNote: "One-time purchase. No subscription, no renewal.",
  checkout: "Checkout",
  upgradeTo: (name: string) => `Upgrade to ${name}`,
  savePercent: (percent: number) => `Save ${percent}%`,
  billedCaption: (period: Period) => (period === "year" ? "Billed yearly" : "Billed monthly"),
  renewalLine: (period: Period) => (period === "year" ? "Renews every year. Cancel anytime." : "Renews every month. Cancel anytime."),
} as const;

export const rendersLabel = (count: number) => `${count} renders`;

export type Period = "month" | "year";

/** `stripe` = website only, `all` = everywhere; `both` is the two mobile stores and never the website (subscriptions/models.py PlanPlatforms). */
const WEB_PLATFORMS = new Set(["stripe", "all"]);

/** KMP formatReferencePrice: minor units → "$12.99" for USD, "12.99 CAD" otherwise. */
export function formatPrice(amountMinor: number, currency: string): string {
  const safe = Math.max(0, Math.trunc(amountMinor));
  const major = Math.floor(safe / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const minor = String(safe % 100).padStart(2, "0");
  return currency.toLowerCase() === "usd" ? `$${major}.${minor}` : `${major}.${minor} ${currency.toUpperCase()}`;
}

export interface PlanOption {
  period: Period;
  priceId: string;
  amount: number;
  currency: string;
  maxCredits: number;
  plan: SubscriptionPlan;
}
export interface PlanGroup { name: string; options: PlanOption[] }

const periodOf = (value: string): Period => (["year", "yearly", "annual"].includes(value.trim().toLowerCase()) ? "year" : "month");

/** Sellable on the website: active, has a Stripe price, platform stripe/all. Rows with the same name become one card (monthly + yearly). */
export function stripePlanGroups(plans: SubscriptionPlan[]): PlanGroup[] {
  const groups = new Map<string, PlanGroup>();
  for (const plan of plans) {
    if (!plan.stripePriceId || !plan.isActive || !WEB_PLATFORMS.has(plan.platforms.toLowerCase())) continue;
    if (plan.name.trim().toLowerCase() === "free") continue;
    const group = groups.get(plan.name) ?? { name: plan.name, options: [] };
    group.options.push({ period: periodOf(plan.period), priceId: plan.stripePriceId, amount: plan.amount, currency: plan.currency, maxCredits: plan.maxCredits, plan });
    groups.set(plan.name, group);
  }
  return [...groups.values()].map((g) => ({ ...g, options: g.options.sort((a, b) => (a.period === b.period ? 0 : a.period === "month" ? -1 : 1)) }));
}

/** KMP calculateYearlySavingsPercent: null unless the year is cheaper than twelve months by at least 1 %. */
export function yearlySavingsPercent(monthly: PlanOption | undefined, yearly: PlanOption | undefined): number | null {
  if (!monthly || !yearly || monthly.amount <= 0 || yearly.amount <= 0) return null;
  const twelve = monthly.amount * 12;
  if (yearly.amount >= twelve) return null;
  const percent = Math.floor(((twelve - yearly.amount) * 100) / twelve);
  return percent >= 1 ? percent : null;
}

/** The struck-through price shown on the yearly card, or null when there is no saving. */
export const yearlyFullPrice = (monthly: PlanOption | undefined, yearly: PlanOption | undefined): string | null =>
  monthly && yearly && yearlySavingsPercent(monthly, yearly) !== null ? formatPrice(monthly.amount * 12, monthly.currency) : null;

/** KMP defaultBillingPeriod: yearly when it exists. */
export const defaultPeriod = (options: PlanOption[]): Period | undefined => options.find((o) => o.period === "year")?.period ?? options[0]?.period;

/** KMP isCurrentSubscription: same plan row and same period, and the subscription is entitled. */
export function isCurrentOption(me: MySubscription | undefined | null, option: PlanOption): boolean {
  const sub = me?.subscription;
  if (!sub?.isEntitled || !sub.plan) return false;
  return sub.plan.uuid === option.plan.uuid && periodOf(sub.plan.period) === option.period;
}

/** The plan name is a subscription plan in the entitlement (any period) — used to skip checkout for a plan the user already has. */
export const isEntitledToPlan = (me: MySubscription | undefined | null, option: PlanOption): boolean => isCurrentOption(me, option);

/** "Archibi Studio" → ["Archibi ", "Studio"]: the last word is drawn red; one-word names stay one colour. */
export function splitPlanTitle(name: string): [string, string] {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return [name, ""];
  return [`${words.slice(0, -1).join(" ")} `, words[words.length - 1] ?? ""];
}

/** What the receipt and the order summary need, shaped like the app's StripePlan. */
export function stripePlanOf(option: PlanOption): StripePlan {
  return {
    productId: option.plan.uuid.toString(),
    creditsCount: option.maxCredits,
    name: option.plan.name,
    image: option.plan.image,
    priceId: option.priceId,
    amount: option.amount,
    currency: option.currency,
  };
}

/** 12 for yearly, else 1 (SubscriptionPlan.periodMonths). */
export const periodMonths = (period: string): number => (periodOf(period) === "year" ? 12 : 1);
