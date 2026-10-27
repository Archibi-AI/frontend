"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { PasswordInput } from "@/shared/ui/password-input";
import { useToast } from "@/shared/ui/toast";

const Form = z
  .object({ old: z.string().min(1, "Enter your current password."), next: z.string().min(8, "Use at least 8 characters."), confirm: z.string() })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "New and Confirm Password must be the same!" });
type Values = z.infer<typeof Form>;

/** Mirrors AccountUpdateViewModel.changePassword; the app's token (and this session) stay valid. */
export function ChangePasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [oldError, setOldError] = useState<string>();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState } = useForm<Values>({ resolver: zodResolver(Form) });

  async function onSubmit(v: Values) {
    setError(undefined);
    setOldError(undefined);
    try {
      const res = await bffFetch<{ message: string }>("/bff/account/change-password", jsonInit("POST", { old_password: v.old, new_password: v.next, confirm_password: v.confirm }));
      toast({ kind: "success", title: res.message });
      router.replace(routes.account.index());
    } catch (e) {
      if (e instanceof AppError && e.code === "WRONG_OLD_PASSWORD") setOldError(e.message);
      else setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      {error && <div role="alert" className="border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
      <PasswordInput label="Current password" autoComplete="current-password" error={oldError ?? formState.errors.old?.message} {...register("old")} />
      <PasswordInput label="New password" autoComplete="new-password" error={formState.errors.next?.message} {...register("next")} />
      <PasswordInput label="Confirm new password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" loading={formState.isSubmitting}>Change password</Button>
    </form>
  );
}
