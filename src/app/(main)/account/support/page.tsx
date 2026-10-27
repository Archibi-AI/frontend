import type { Metadata } from "next";
import { SupportForm } from "@/features/account/components/support-form";
import { getSessionTokens } from "@/server/session/cookies";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Contact Support" };

export default async function SupportPage() {
  const { user } = await getSessionTokens();
  return (
    <>
      <PageHeading eyebrow="Help" title="Contact Support" subtitle="We usually reply within one business day." />
      <SupportForm username={user?.username ?? ""} defaultName={user?.username ?? ""} />
    </>
  );
}
