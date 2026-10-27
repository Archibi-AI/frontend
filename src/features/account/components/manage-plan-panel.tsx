"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { formatDate } from "@/shared/lib/format";
import { isFreePlan, planStatusLine, providerOf, rendersLine } from "../model/summary";
import type { AccountSummary } from "../schemas";
import { PlanCard } from "./plan-card";

/** Mirrors ManagePlanScreen/ViewModel: Stripe → cancel at period end; Apple/Google → open the store's page. */
export function ManagePlanPanel({ initial }: { initial: AccountSummary }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const summary = useQuery({ queryKey: ["me", "summary"], queryFn: () => bffFetch<AccountSummary>("/bff/account/summary"), initialData: initial, staleTime: 60_000 });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const plan = summary.data.plan;
  const provider = providerOf(plan);
  const unavailable = error === AppMessages.subscriptionsUnavailable;

  async function cancel() {
    setBusy(true);
    setError(undefined);
    try {
      const res = await bffFetch<{ message: string; detail?: string | null; periodEnd?: string | null }>("/bff/billing/subscription/cancel", { method: "POST" });
      toast({ kind: "success", title: res.detail ?? "Subscription will not renew after the current period.", description: res.periodEnd ? `Access until ${formatDate(res.periodEnd)}` : undefined });
      await queryClient.invalidateQueries({ queryKey: ["me", "summary"] });
      setConfirming(false);
    } catch (e) {
      const err = e instanceof AppError ? e : null;
      setError(err ? (err.code === "NOT_FOUND" ? "You have no active subscription to cancel." : err.message) : AppMessages.somethingWrong);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  async function openStore(p: "apple" | "google") {
    setError(undefined);
    try {
      const { manageUrl } = await bffFetch<{ manageUrl: string }>("/bff/billing/subscription/manage-url", { query: { provider: p } });
      window.open(manageUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
    }
  }

  return (
    <div className="max-w-2xl">
      <PlanCard summary={summary.data} />
      {error && <div role="alert" className="mb-6 border border-danger px-4 py-3 text-sm text-danger">{unavailable ? "Subscriptions are not available yet." : error}</div>}
      <section className="rounded-md border border-line bg-surface p-6">
        {isFreePlan(plan) && provider === "none" && (
          <>
            <h2 className="font-display text-lg font-medium text-ink-2">You&apos;re on the free plan</h2>
            <p className="mt-1 text-[15px] text-subtle">{rendersLine(plan)}. Upgrade for more renders every month.</p>
            <Link href={routes.billing.index("subscriptions")} className={buttonVariants({ className: "mt-4" })}>See plans</Link>
          </>
        )}
        {provider === "stripe" && (
          <>
            <h2 className="font-display text-lg font-medium text-ink-2">Subscription</h2>
            <p className="mt-1 text-[15px] text-subtle">{planStatusLine(plan) || "Billed through Stripe."}</p>
            {plan.endsOn ? (
              <p className="mt-3 text-sm text-ink-3">Your subscription is set to end — you keep access until {formatDate(plan.endsOn)}.</p>
            ) : (
              <Button variant="secondary" className="mt-4" onClick={() => setConfirming(true)}>Cancel subscription</Button>
            )}
          </>
        )}
        {provider === "apple" && (
          <>
            <h2 className="font-display text-lg font-medium text-ink-2">Managed by the App Store</h2>
            <p className="mt-1 text-[15px] text-subtle">Change or cancel in your Apple ID settings (iPhone: Settings → your name → Subscriptions).</p>
            <Button className="mt-4" onClick={() => openStore("apple")}>Manage in App Store</Button>
          </>
        )}
        {provider === "google" && (
          <>
            <h2 className="font-display text-lg font-medium text-ink-2">Managed by Google Play</h2>
            <p className="mt-1 text-[15px] text-subtle">Change or cancel your subscription in Google Play.</p>
            <Button className="mt-4" onClick={() => openStore("google")}>Manage in Google Play</Button>
          </>
        )}
        {!isFreePlan(plan) && provider === "none" && <p className="text-[15px] text-subtle">Your plan is managed by Archibi. Contact support for changes.</p>}
      </section>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent size="sm">
          <DialogTitle>Cancel subscription?</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted">
            You keep your plan and renders until the end of the current period. You won&apos;t be charged again.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-3">
            <DialogClose asChild><Button variant="secondary" size="sm">Keep plan</Button></DialogClose>
            <Button variant="danger" size="sm" loading={busy} onClick={cancel}>Cancel subscription</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
