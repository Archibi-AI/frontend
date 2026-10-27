import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CheckoutView } from "@/features/billing/components/checkout-view";
import { isEntitledToPlan, stripePlanGroups, stripePlanOf } from "@/features/billing/model/catalog";
import { getAndroidStripeProducts, getMySubscription, getSubscriptionPlans } from "@/features/billing/server/repository";
import { loadPage } from "@/server/page-data";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id: raw } = await params;
  const id = decodeURIComponent(raw);
  const here = routes.billing.checkout(kind === "subscription" ? "subscription" : "credits", id);

  if (kind === "credits") {
    const products = await loadPage(here, () => getAndroidStripeProducts());
    const pack = products.plans.find((p) => p.priceId === id);
    if (!pack) notFound();
    return (
      <>
        <PageHeading eyebrow="Checkout" title={pack.name} subtitle="Review your order and pay securely with Stripe." />
        <CheckoutView kind="credits" plan={pack} baselineCredits={products.userCredits} />
      </>
    );
  }
  if (kind !== "subscription") notFound();

  const plans = await loadPage(here, () => getSubscriptionPlans().catch((e: unknown) => (e instanceof AppError && e.code === "FORBIDDEN" ? null : Promise.reject(e))));
  if (!plans) redirect(routes.billing.index("credits"));
  const option = stripePlanGroups(plans.plans).flatMap((g) => g.options).find((o) => o.priceId === id);
  if (!option) notFound();
  const me = await loadPage(here, () => getMySubscription());
  if (isEntitledToPlan(me, option)) redirect(routes.account.managePlan());
  return (
    <>
      <PageHeading eyebrow="Checkout" title={option.plan.name} subtitle="Review your plan and pay securely with Stripe." />
      <CheckoutView kind="subscription" plan={stripePlanOf(option)} period={option.period} baselineCredits={plans.userCredits} />
    </>
  );
}
