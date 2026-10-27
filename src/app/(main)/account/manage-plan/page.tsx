import type { Metadata } from "next";
import { ManagePlanPanel } from "@/features/account/components/manage-plan-panel";
import { getAccountSummary } from "@/features/account/server/repository";
import { loadPage } from "@/server/page-data";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Manage plan" };

export default async function ManagePlanPage() {
  const summary = await loadPage(routes.account.managePlan(), () => getAccountSummary());
  return (
    <>
      <PageHeading eyebrow="Plan & Billing" title="Manage plan" subtitle="See your plan, renders and renewal — or change it." />
      <ManagePlanPanel initial={summary} />
    </>
  );
}
