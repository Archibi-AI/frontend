"use client";
import { AlertCircle, CheckCircle2, Copy, MinusCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/ui/toast";
import { RECEIPT_TITLES, receiptShareText, type ReceiptData, type ReceiptStatus } from "../model/receipt";

const STAMP: Record<ReceiptStatus, { tint: string; surface: string; Icon: typeof CheckCircle2 }> = {
  accepted: { tint: "text-success", surface: "bg-success/10", Icon: CheckCircle2 },
  canceled: { tint: "text-ink-3", surface: "bg-track", Icon: MinusCircle },
  rejected: { tint: "text-danger", surface: "bg-danger/10", Icon: AlertCircle },
};

/** Height of the tear-off stub below the notches (KMP StubHeightDp). */
const STUB = 196;
const NOTCH = 13;
const notchMask = [0, 1]
  .map((side) => `radial-gradient(circle ${NOTCH}px at ${side * 100}% calc(100% - ${STUB}px), #0000 98%, #000)`)
  .join(",");

function Label({ children }: { children: string }) {
  return <p className="text-[9px] font-medium uppercase tracking-[.1em] text-subtle">{children}</p>;
}
const Rule = () => <hr className="mx-[22px] border-0 border-t border-dashed border-black/15" />;

/** KMP PaymentReceiptCard: a monochrome tear-off ticket — status stamp, plan, invoice / amount / credits, provider and date, branded stub. */
export function ReceiptCard({ receipt, onDone }: { receipt: ReceiptData; onDone: () => void }) {
  const toast = useToast();
  const { tint, surface, Icon } = STAMP[receipt.status];

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(receipt.invoiceId);
      toast({ kind: "success", title: "Invoice ID copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy the invoice ID" });
    }
  }

  async function share() {
    const text = receiptShareText(receipt);
    try {
      if (navigator.share) await navigator.share({ title: "Share receipt", text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ kind: "success", title: "Receipt copied" });
      }
    } catch {
      // the share sheet was dismissed
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px] [filter:drop-shadow(0_0_0.5px_rgb(0_0_0/0.45))_drop-shadow(0_10px_14px_rgb(16_24_40/0.12))]">
      <article
        aria-label={RECEIPT_TITLES[receipt.status]}
        className="flex flex-col rounded-[26px] bg-white"
        style={{ WebkitMaskImage: notchMask, maskImage: notchMask, WebkitMaskComposite: "source-in", maskComposite: "intersect" }}
      >
        <header className="flex flex-col items-center px-[22px] pt-[26px]">
          <div className={cn("flex size-[58px] items-center justify-center rounded-pill", surface)}>
            <Icon className={cn("size-8", tint)} aria-hidden />
          </div>
          <h2 className={cn("mt-3.5 text-[22px] font-semibold", tint)}>{RECEIPT_TITLES[receipt.status]}</h2>
          <p className="mt-1 line-clamp-2 text-center text-sm text-subtle">{receipt.planName}</p>
        </header>
        <div className="py-[18px]"><Rule /></div>

        <div className="px-[22px]">
          <div className="grid grid-cols-[1.5fr_1fr_.6fr] items-start gap-2">
            <button type="button" onClick={copyInvoice} className="min-w-0 text-left" aria-label="Copy invoice ID">
              <span className="flex items-center gap-1"><Label>Invoice ID</Label><Copy className="size-[11px] text-subtle" aria-hidden /></span>
              <span className="mt-1 block truncate text-[13px] font-medium text-ink">{receipt.invoiceId}</span>
            </button>
            <div className="text-center"><Label>Amount</Label><p className="mt-1 truncate text-[13px] font-medium text-ink">{receipt.amount}</p></div>
            <div className="text-right"><Label>Credits</Label><p className="mt-1 text-[13px] font-medium text-ink">{receipt.creditsCount}</p></div>
          </div>
          <div className="mt-[18px] grid grid-cols-[1fr_1.3fr] items-center gap-2">
            <div className="flex flex-col items-center">
              <Label>Paid with</Label>
              <div className="mt-1.5 flex items-center gap-[7px]">
                <Image src="/web-static/brand/stripe-logo.png" alt="" width={42} height={18} className="h-[18px] w-auto" />
                <span className="text-[13px] font-medium text-ink">{receipt.providerName}</span>
              </div>
            </div>
            <div className="text-center"><Label>Date &amp; Time</Label><p className="mt-1 text-xs font-medium text-ink">{receipt.dateTime}</p></div>
          </div>
          {receipt.expiresAt && (
            <div className="mt-4 text-center"><Label>Expires on</Label><p className="mt-1 text-[13px] font-medium text-ink">{receipt.expiresAt}</p></div>
          )}
        </div>
        <div className="flex-1 pb-[18px]" />

        <Rule />
        <footer className="flex flex-col items-center justify-evenly px-[22px]" style={{ height: STUB }}>
          <Image src="/web-static/brand/archibi-logo-dark.png" alt="Archibi" width={96} height={49} className="h-[49px] w-[96px] object-contain" />
          <p className="text-[11px] tracking-[2px] text-subtle">THANK YOU FOR YOUR PURCHASE</p>
          <div className="flex w-full gap-2.5">
            <button type="button" onClick={onDone} className="h-[46px] flex-1 rounded-[13px] bg-ink text-sm font-semibold text-white transition-opacity hover:opacity-85">Done</button>
            <button type="button" onClick={share} className="inline-flex h-[46px] flex-1 items-center justify-center gap-[7px] rounded-[13px] border border-ink text-sm font-semibold text-ink transition-colors hover:bg-track">
              <Share2 className="size-4" aria-hidden />Share
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
