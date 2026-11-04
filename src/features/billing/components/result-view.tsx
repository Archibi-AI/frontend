"use client";
import { useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { routes } from "@/shared/config/routes";
import { bffFetch } from "@/shared/http/bff-fetch";
import { buttonVariants } from "@/shared/ui/button";
import { PaywallText } from "../model/catalog";
import { pollUntil } from "../model/checkout";
import { buildReceipt, receiptStatusOf } from "../model/receipt";
import { statusOfIntent } from "../model/result";
import type { MySubscription, StripePlan } from "../schemas";
import { ReceiptCard } from "./receipt-card";

export interface ResultViewProps {
  kind: "subscription";
  plan: StripePlan;
  id: string;
  /** Already resolved on the server (redirect_status wins over the optimistic URL status). */
  status: string;
  months?: number;
  /** When the payment happened; fixed in the URL so a reload never re-issues the receipt. */
  at: number;
  /** Set when Stripe sent the buyer back with ?payment_intent_client_secret (3-D Secure / redirect methods). */
  returnedClientSecret?: string;
}

/** premium_results: the receipt, plus what the web adds around it — the wait for the Stripe webhook that activates the subscription. */
export function ResultView(props: ResultViewProps) {
  const { kind, plan, id, months, at, returnedClientSecret } = props;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(props.status);
  const receiptStatus = receiptStatusOf(status);
  const processing = status === "processing";
  const receipt = useMemo(() => buildReceipt({ plan, status, at: new Date(at), months: receiptStatus === "accepted" ? months : undefined }), [plan, status, at, months, receiptStatus]);
  const handled = useRef(false);

  // A buyer returning from Stripe's redirect never ran our confirm handler: resolve the real status, and record it once.
  useEffect(() => {
    if (!returnedClientSecret || handled.current) return;
    handled.current = true;
    (async () => {
      let resolved = props.status;
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (key) {
        try {
          const stripe = await loadStripe(key);
          const found = await stripe?.retrievePaymentIntent(returnedClientSecret);
          resolved = statusOfIntent(found?.paymentIntent?.status) ?? resolved;
          setStatus(resolved);
        } catch {
          // keep the status Stripe put in the URL
        }
      }
    })();
  }, [returnedClientSecret, props.status]);

  // Subscription still processing: read my subscription every 5 s for up to 60 s.
  const [pollFinished, setPollFinished] = useState(false);
  useEffect(() => {
    if (!processing) return;
    let cancelled = false;
    void pollUntil(async () => !cancelled && !!(await bffFetch<MySubscription>("/bff/billing/subscription")).subscription?.isEntitled, { attempts: 12, intervalMs: 5000 }).then((active) => {
      if (cancelled) return;
      setPollFinished(true);
      if (active) {
        setStatus("activated");
        void queryClient.invalidateQueries({ queryKey: ["me", "summary"] });
        void queryClient.invalidateQueries({ queryKey: ["me", "credits"] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [processing, queryClient]);

  const retryHref = routes.billing.checkout(kind, id);
  const link = buttonVariants({ variant: "secondary", size: "sm" });

  return (
    <div className="mx-auto flex max-w-[460px] flex-col items-center gap-5">
      {processing ? (
        <section role="status" className="w-full rounded-lg border border-line bg-surface p-6 text-center shadow-card">
          <h2 className="font-display text-xl font-medium text-ink-2">We&apos;re confirming your subscription</h2>
          <p className="mt-2 text-[15px] text-subtle">{PaywallText.processing}</p>
          {!pollFinished && <Loader2 className="mx-auto mt-4 size-5 animate-spin text-brand" aria-label="Checking" />}
        </section>
      ) : (
        <>
          {receiptStatus !== "accepted" && (
            <p role="alert" className="w-full rounded-md border border-danger/40 px-4 py-3 text-center text-sm text-danger">
              Payment not completed. <Link href={retryHref} className="font-semibold underline underline-offset-2">Try again</Link>
            </p>
          )}
          <ReceiptCard receipt={receipt} onDone={() => router.push(routes.ai.index())} />
        </>
      )}
      <nav aria-label="After your purchase" className="flex flex-wrap justify-center gap-3">
        <Link href={routes.account.managePlan()} className={link}>Manage plan</Link>
        <Link href={routes.account.transactions()} className={link}>View transactions</Link>
        {processing && <Link href={routes.ai.index()} className={link}>Start designing</Link>}
      </nav>
    </div>
  );
}
