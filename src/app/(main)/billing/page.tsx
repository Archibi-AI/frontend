import type { Metadata } from "next";
import { Paywall } from "@/features/billing/components/paywall";
import { stripePlanGroups } from "@/features/billing/model/catalog";
import { getAndroidStripeProducts, getMySubscription, getSubscriptionPlans } from "@/features/billing/server/repository";
import { loadPage } from "@/server/page-data";
import { routes, type BillingSection } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";

export const metadata: Metadata = { title: "Plans & Billing" };

const SECTIONS: BillingSection[] = ["all", "credits", "subscriptions"];

/** `settled` that keeps a 401 flowing to the login redirect but turns every other failure into an in-page message. */
async function settle<T>(run: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: AppError }> {
  try {
    return { ok: true, value: await run() };
  } catch (e) {
    return { ok: false, error: AppError.from(e) };
  }
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section: raw } = await searchParams;
  const section = SECTIONS.find((s) => s === raw) ?? "all";
  // Names are the Ktor methods; "Android" is historical (PaymentViewModel.fetchStripeProductsAPI, STRIPE branch).
  const [packs, subs, me] = await loadPage(routes.billing.index(section), () =>
    Promise.all([settle(() => getAndroidStripeProducts()), settle(() => getSubscriptionPlans()), settle(() => getMySubscription())]),
  );
  for (const r of [packs, subs, me]) if (!r.ok && r.error.code === "UNAUTHORIZED") await loadPage(routes.billing.index(section), () => Promise.reject(r.error));
  const gated = (r: { ok: boolean; error?: AppError }) => !r.ok && r.error?.code === "FORBIDDEN";
  return (
    <Paywall
      section={section}
      packs={packs.ok ? packs.value.plans : null}
      groups={subs.ok ? stripePlanGroups(subs.value.plans) : null}
      subscriptionsUnavailable={gated(subs)}
      me={me.ok ? me.value : null}
      userCredits={packs.ok ? packs.value.userCredits : subs.ok ? subs.value.userCredits : 0}
    />
  );
}
