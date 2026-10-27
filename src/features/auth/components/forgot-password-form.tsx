"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { AuthHeading, FormAlert } from "./auth-layout";

const Form = z.object({ email: z.string().trim().email("Enter a valid email address.") });
type Values = z.infer<typeof Form>;

/** Mirrors PasswordRecoveryScreen (A4): the backend emails a new password. */
export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(Form) });

  async function onSubmit(values: Values) {
    setError(undefined);
    try {
      await bffFetch("/bff/auth/forgot-password", jsonInit("POST", values));
      setSent(true);
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  if (sent) {
    return (
      <>
        <AuthHeading eyebrow="Password recovery" title="Email sent." />
        <FormAlert kind="success">{AppMessages.recoveryEmailSent}</FormAlert>
        <Link href={routes.auth.login()} className={buttonVariants({ className: "w-full" })}>
          Back to sign in
        </Link>
      </>
    );
  }
  return (
    <>
      <AuthHeading eyebrow="Password recovery" title="Forgot your password?" subtitle="Enter your email and we'll send you a new one." />
      <FormAlert>{error}</FormAlert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="username" inputMode="email" error={formState.errors.email?.message} {...register("email")} />
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Send new password
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-subtle">
        <Link href={routes.auth.login()} className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
