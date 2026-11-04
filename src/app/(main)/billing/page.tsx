import type { Metadata } from "next";
import { Paywall } from "@/features/billing/components/paywall";
import { stripePlanGroups } from "@/features/billing/model/catalog";
import { getMySubscription, getSubscriptionPlans } from "@/features/billing/server/repository";
import { loadPage } from "@/server/page-data";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";

export const metadata: Metadata = { title: "Plans & Billing" };

/** `settled` that keeps a 401 flowing to the login redirect but turns every other failure into an in-page message. */
async function settle<T>(run: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: AppError }> {
  try {
    return { ok: true, value: await run() };
  } catch (e) {
    return { ok: false, error: AppError.from(e) };
  }
}

/** Subscriptions only: the website does not sell one-time render packs. */
export default async function BillingPage() {
  const [subs, me] = await loadPage(routes.billing.index(), () => Promise.all([settle(() => getSubscriptionPlans()), settle(() => getMySubscription())]));
  for (const r of [subs, me]) if (!r.ok && r.error.code === "UNAUTHORIZED") await loadPage(routes.billing.index(), () => Promise.reject(r.error));
  const gated = !subs.ok && subs.error.code === "FORBIDDEN";
  return (
    <Paywall
      groups={subs.ok ? stripePlanGroups(subs.value.plans) : null}
      subscriptionsUnavailable={gated}
      me={me.ok ? me.value : null}
      userCredits={subs.ok ? subs.value.userCredits : 0}
    />
  );
}
