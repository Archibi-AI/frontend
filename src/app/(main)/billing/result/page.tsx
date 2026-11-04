import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ResultView } from "@/features/billing/components/result-view";
import { stripePlanGroups, stripePlanOf } from "@/features/billing/model/catalog";
import { resolveReturnStatus } from "@/features/billing/model/result";
import { getSubscriptionPlans } from "@/features/billing/server/repository";
import { loadPage } from "@/server/page-data";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Payment receipt", robots: { index: false, follow: false } };

type Q = Record<"status" | "kind" | "id" | "months" | "t" | "redirect_status" | "payment_intent_client_secret", string | undefined>;

/** Kept out of the component body: the receipt time is an input of the request, not of the render. */
const nowMs = () => Date.now();

export default async function ResultPage({ searchParams }: { searchParams: Promise<Partial<Q>> }) {
  const q = await searchParams;
  if (q.kind === "credits") redirect(routes.billing.index()); // renders are not sold on the web
  const kind = q.kind === "subscription" ? "subscription" : null;
  if (!kind || !q.id) notFound();
  const here = routes.billing.result({ status: q.status ?? "failed", kind, id: q.id });
  const status = resolveReturnStatus(q.status ?? "failed", q.redirect_status);
  const months = q.months && Number(q.months) > 0 ? Number(q.months) : undefined;
  const at = q.t && Number(q.t) > 0 ? Number(q.t) : nowMs();

  const plans = await loadPage(here, () => getSubscriptionPlans());
  const option = stripePlanGroups(plans.plans).flatMap((g) => g.options).find((o) => o.priceId === q.id);
  if (!option) notFound();
  return (
    <>
      <PageHeading eyebrow="Plans & Billing" title="Your receipt" />
      <ResultView kind="subscription" plan={stripePlanOf(option)} id={q.id} status={status} months={months} at={at} returnedClientSecret={q.payment_intent_client_secret} />
    </>
  );
}
