import type { Metadata } from "next";
import { PrivacyPanel } from "@/features/account/components/privacy-panel";
import { getPrivacyInfo } from "@/features/account/server/repository";
import { loadPage } from "@/server/page-data";
import { routes } from "@/shared/config/routes";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Privacy & Data" };

export default async function PrivacyPage() {
  const info = await loadPage(routes.account.privacy(), () => getPrivacyInfo());
  return (
    <>
      <PageHeading eyebrow="Account" title="Privacy & Data" subtitle="Control your data and delete your account." />
      <PrivacyPanel info={info} />
    </>
  );
}
