"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { routes } from "@/shared/config/routes";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast";

/** Mirrors logOutScreen: confirm, sign out of the website only (the app stays signed in), back to login. */
export function SignOutDialog({ trigger }: { trigger: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await bffFetch("/bff/session/logout", { method: "POST" });
    } finally {
      queryClient.removeQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      toast({ kind: "info", title: "logout successfully" });
      router.replace(routes.auth.login());
      router.refresh();
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent size="sm">
        <DialogTitle>Log out?</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted">You&apos;ll be signed out of the website. The Archibi app stays signed in.</DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="secondary" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={signOut} loading={busy}>Log out</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
