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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useFinishSignIn } from "../client/use-auth-actions";
import type { AuthResult } from "../model/user";
import { AuthHeading, FormAlert } from "./auth-layout";

const Form = z.object({ code: z.string().transform((v) => v.replace(/\D/g, "")).pipe(z.string().regex(/^\d{4,8}$/, "Enter the code from your email.")) });
type Input = z.input<typeof Form>;
type Values = z.output<typeof Form>;

/** Mirrors EmailVerificationScreen (A3): success → signed in; the app shows "Registered successfully!". */
export function VerifyForm({ email }: { email: string }) {
  const finish = useFinishSignIn(null);
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState } = useForm<Input, unknown, Values>({ resolver: zodResolver(Form) });

  async function onSubmit({ code }: Values) {
    setError(undefined);
    try {
      await finish(await bffFetch<AuthResult>("/bff/auth/verify", jsonInit("POST", { email, code })), AppMessages.signedUp);
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  return (
    <>
      <AuthHeading eyebrow="Verify email" title="Check your inbox." subtitle={`We sent a verification code to ${email}.`} />
      <FormAlert>{error}</FormAlert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="text-center text-xl tracking-[.4em]"
          error={formState.errors.code?.message}
          {...register("code")}
        />
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Verify and continue
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-subtle">
        Didn&apos;t get it?{" "}
        <Link href={routes.auth.signup()} className="font-medium text-brand hover:underline">
          Go back and sign up again
        </Link>
      </p>
    </>
  );
}
