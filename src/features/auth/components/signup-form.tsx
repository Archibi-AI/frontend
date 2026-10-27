"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { AuthHeading, FormAlert } from "./auth-layout";
import { Legal } from "./login-form";
import { SocialButtons } from "./social-buttons";

const Form = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match." });
type Values = z.infer<typeof Form>;

/** Mirrors SignUpScreen + SignUpViewModel (A2): success → verification screen. */
export function SignupForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(Form) });

  async function onSubmit({ email, password }: Values) {
    setError(undefined);
    try {
      await bffFetch("/bff/auth/signup", jsonInit("POST", { email, password }));
      router.push(routes.auth.verify(email));
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  return (
    <>
      <AuthHeading eyebrow="Create account" title="Join Archibi." subtitle="Design, get inspired and hire pros — free to start." />
      <FormAlert>{error}</FormAlert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input label="Email" type="email" autoComplete="username" inputMode="email" error={formState.errors.email?.message} {...register("email")} />
        <PasswordInput label="Password" autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
        <PasswordInput label="Confirm password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Create account
        </Button>
      </form>
      <SocialButtons next={next} />
      <p className="mt-8 text-center text-sm text-subtle">
        Already have an account?{" "}
        <Link href={routes.auth.login(next ?? undefined)} className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
      <Legal />
    </>
  );
}
