"use client";
import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Avatar } from "@/shared/ui/avatar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useToast } from "@/shared/ui/toast";
import Link from "next/link";
import { toSquarePng } from "../model/image";

/** Mirrors AccountUpdateViewModel.updateUserProfile: username only when changed, picture as image/png. */
export function EditProfileForm({ username, email, imageUri }: { username: string; email: string; imageUri: string }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(username);
  const [picture, setPicture] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Image format not supported. Conversion failed.");
    try {
      const png = await toSquarePng(file);
      setPicture(png);
      setPreview(URL.createObjectURL(png));
      setError(undefined);
    } catch {
      setError("Image format not supported. Conversion failed.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const changedName = name.trim() !== username && name.trim() !== "";
    if (!changedName && !picture) return setError("Nothing to update.");
    setBusy(true);
    setError(undefined);
    const form = new FormData();
    if (changedName) form.set("username", name.trim());
    if (picture) form.set("profilePicture", picture, picture.name);
    try {
      await bffFetch("/bff/account/profile", { method: "PUT", body: form });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast({ kind: "success", title: AppMessages.accountUpdated });
      router.replace(routes.account.index());
      router.refresh();
    } catch (err) {
      setError(err instanceof AppError ? err.message : AppMessages.somethingWrong);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-6">
      {error && <div role="alert" className="border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
      <div className="flex items-center gap-5">
        <button type="button" onClick={() => input.current?.click()} className="group relative rounded-pill" aria-label="Change profile picture">
          <Avatar src={preview ?? (imageUri || null)} name={name || email} className="size-24 text-2xl" />
          <span className="absolute inset-0 flex items-center justify-center rounded-pill bg-night/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="size-6" aria-hidden />
          </span>
        </button>
        <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Profile picture" onChange={(e) => pick(e.target.files?.[0])} />
        <p className="text-sm text-subtle">Square photos work best. PNG, JPG or WebP.</p>
      </div>
      <Input label="Username" value={name} onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
      <Input label="Email" value={email} readOnly disabled />
      <div className="flex gap-3">
        <Button type="submit" loading={busy}>Save changes</Button>
        <Link href={routes.account.index()} className={buttonVariants({ variant: "secondary" })}>Cancel</Link>
      </div>
    </form>
  );
}
