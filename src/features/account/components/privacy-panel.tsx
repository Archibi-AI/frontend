"use client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { formatDate } from "@/shared/lib/format";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { AccountPrivacy } from "../schemas";

/** Mirrors PrivacyDataScreen + DangerZoneCard: type the confirmation word, schedule deletion, session cleared. */
export function PrivacyPanel({ info }: { info: AccountPrivacy }) {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [scheduled, setScheduled] = useState<{ message: string; date?: string | null }>();
  const matches = typed.trim() === info.confirmationWord;

  async function requestDeletion() {
    setBusy(true);
    setError(undefined);
    try {
      const res = await bffFetch<{ message: string; deletionScheduledFor?: string | null }>("/bff/account/delete", jsonInit("POST", { confirmation: info.confirmationWord }));
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.setQueryData(["session"], { authenticated: false });
      setScheduled({ message: res.message, date: res.deletionScheduledFor });
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
      setBusy(false);
    }
  }

  if (scheduled) {
    return (
      <div role="status" className="max-w-xl rounded-md border border-success p-6">
        <h2 className="font-display text-xl font-medium text-ink-2">{scheduled.message}</h2>
        {scheduled.date && <p className="mt-2 text-sm text-ink-3">Scheduled for {formatDate(scheduled.date)}.</p>}
        <p className="mt-2 text-sm text-subtle">Changed your mind? Sign in again within {info.deletionGraceDays} days and your account is restored.</p>
        <Link href={routes.auth.login()} className={buttonVariants({ className: "mt-5" })}>Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="rounded-md border border-line bg-surface p-6">
        <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[.08em] text-ink-2">Privacy controls</h2>
        {info.privacyControlsText ? (
          <p className="whitespace-pre-line text-[15px] text-ink-3">{info.privacyControlsText}</p>
        ) : (
          <p className="text-[15px] text-ink-3">
            Read our{" "}
            <a href={routes.wordpress.privacy} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Privacy Policy</a>{" "}
            to see how your data is used.
          </p>
        )}
        {info.helpBeforeDeletingUrl && (
          <a href={info.helpBeforeDeletingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
            Get help before deleting
          </a>
        )}
      </section>
      <section className="rounded-md border border-danger p-6" aria-labelledby="danger-title">
        <h2 id="danger-title" className="mb-2 text-[13px] font-bold uppercase tracking-[.08em] text-danger">Delete account</h2>
        <p className="mb-5 text-[15px] text-ink-3">
          Your account is hidden and signed out everywhere immediately, and erased after {info.deletionGraceDays} days. Sign in again before then to cancel.
        </p>
        {error && <div role="alert" className="mb-4 border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
        <Input label={`Type ${info.confirmationWord} to confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={info.confirmationWord} autoComplete="off" />
        <Button variant="danger" className="mt-4" disabled={!matches} loading={busy} onClick={requestDeletion}>
          Delete my account
        </Button>
      </section>
    </div>
  );
}
