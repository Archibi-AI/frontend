import type { AccountSummary } from "../schemas";
import { formatDate, pluralize } from "@/shared/lib/format";

export type Provider = "stripe" | "apple" | "google" | "none";

/** `plan.provider` drives manage-plan: stripe → cancel, apple/google → open the store (ManagePlanViewModel). */
export function providerOf(plan: AccountSummary["plan"]): Provider {
  const p = (plan.provider ?? "").toLowerCase();
  if (p.includes("stripe")) return "stripe";
  if (p.includes("apple")) return "apple";
  if (p.includes("google")) return "google";
  return "none";
}

export const isFreePlan = (plan: AccountSummary["plan"]) => plan.kind === "free" || (!plan.provider && plan.rendersAllowance === 0);

export function planStatusLine(plan: AccountSummary["plan"]): string {
  if (plan.graceUntil) return `Payment issue — access until ${formatDate(plan.graceUntil)}`;
  if (plan.endsOn) return `Ends on ${formatDate(plan.endsOn)}`;
  if (plan.renewsOn) return `Renews on ${formatDate(plan.renewsOn)}`;
  return "";
}

export function rendersLine(plan: AccountSummary["plan"]): string {
  const period = plan.allowancePeriod ? ` this ${plan.allowancePeriod}` : "";
  return plan.rendersAllowance > 0
    ? `${plan.rendersRemaining} of ${plan.rendersAllowance} renders left${period}`
    : `${pluralize(plan.rendersRemaining, "render")} left`;
}

export function topUpExpiryLine(topUp: NonNullable<AccountSummary["topUp"]>): string {
  const next = topUp.nextExpiry;
  return next ? `${pluralize(next.rendersRemaining, "render")} expire on ${formatDate(next.expiresOn)}` : "";
}
