"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { useFinishSignIn } from "../client/use-auth-actions";
import type { AuthResult } from "../model/user";
import { AuthHeading, FormAlert } from "./auth-layout";
import { SocialButtons } from "./social-buttons";

const Form = z.object({ email: z.string().trim().min(1, "Enter your email."), password: z.string().min(1, "Enter your password.") });
type Values = z.infer<typeof Form>;

/** Mirrors LogInScreen + LogInViewModel: errors use the app's wording; "Forgot password" and "Sign up" links. */
export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");
  const finish = useFinishSignIn(next);
  const [error, setError] = useState<string | undefined>(params.get("error") === "apple" ? "Apple sign-in failed. Please try again." : undefined);
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(Form) });

  async function onSubmit(values: Values) {
    setError(undefined);
    try {
      await finish(await bffFetch<AuthResult>("/bff/auth/login", jsonInit("POST", values)));
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  return (
    <>
      <AuthHeading eyebrow="Sign in" title="Welcome back." subtitle="Sign in to your Archibi account." />
      <FormAlert>{error}</FormAlert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="username" inputMode="email" error={formState.errors.email?.message} {...register("email")} />
        <PasswordInput label="Password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
        <div className="flex justify-end">
          <Link href={routes.auth.forgotPassword()} className="text-[13px] font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <SocialButtons next={next} />
      <p className="mt-8 text-center text-sm text-subtle">
        Don&apos;t have an account?{" "}
        <Link href={routes.auth.signup()} className="font-medium text-brand hover:underline">
          Sign up
        </Link>
      </p>
      <Legal />
    </>
  );
}

export function Legal() {
  return (
    <p className="mt-6 text-center text-xs text-subtle">
      By continuing you agree to our{" "}
      <a href={routes.wordpress.terms} className="underline hover:text-brand">Terms of Service</a> and{" "}
      <a href={routes.wordpress.privacy} className="underline hover:text-brand">Privacy Policy</a>.
    </p>
  );
}
