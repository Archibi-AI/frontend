import type { Metadata } from "next";
import { EditProfileForm } from "@/features/account/components/edit-profile-form";
import { getSessionTokens } from "@/server/session/cookies";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const { user } = await getSessionTokens();
  return (
    <>
      <PageHeading eyebrow="Account" title="Edit profile" subtitle="Change your username and profile picture." />
      <EditProfileForm username={user?.username ?? ""} email={user?.email ?? ""} imageUri={user?.imageUri ?? ""} />
    </>
  );
}
