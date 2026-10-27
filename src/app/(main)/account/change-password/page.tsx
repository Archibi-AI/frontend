import type { Metadata } from "next";
import { ChangePasswordForm } from "@/features/account/components/change-password-form";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Change password" };

export default function ChangePasswordPage() {
  return (
    <>
      <PageHeading eyebrow="Account" title="Change password" subtitle="Choose a new password for your Archibi account." />
      <ChangePasswordForm />
    </>
  );
}
