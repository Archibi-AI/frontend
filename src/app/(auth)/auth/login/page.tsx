import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { routes } from "@/shared/config/routes";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-subtle">
        Just browsing?{" "}
        <Link href={routes.ideabank.index()} className="font-semibold text-brand hover:underline">See the Idea Bank</Link>
        {" or "}
        <Link href={routes.hiring.index()} className="font-semibold text-brand hover:underline">find a pro</Link>
      </p>
    </AuthLayout>
  );
}
