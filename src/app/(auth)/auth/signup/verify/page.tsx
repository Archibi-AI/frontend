import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { VerifyForm } from "@/features/auth/components/verify-form";
import { routes } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const email = z.string().email().safeParse((await searchParams).email);
  if (!email.success) redirect(routes.auth.signup()); // no/invalid email → start over (as the app's route requires {email})
  return (
    <AuthLayout>
      <VerifyForm email={email.data} />
    </AuthLayout>
  );
}
