import type { StripePlan } from "../schemas";

/** PaymentReceiptStatus: the backend vocabulary on the way in, what the user reads on the way out. */
export type ReceiptStatus = "accepted" | "canceled" | "rejected";
export const RECEIPT_TITLES: Record<ReceiptStatus, string> = { accepted: "Payment Accepted", canceled: "Payment Canceled", rejected: "Payment Rejected" };

export function receiptStatusOf(status: string): ReceiptStatus {
  switch (status.trim().toLowerCase()) {
    case "completed": case "complete": case "succeeded": case "success": case "successful": case "activated":
      return "accepted";
    case "canceled": case "cancelled": case "cancel":
      return "canceled";
    default:
      return "rejected";
  }
}

export interface ReceiptData {
  status: ReceiptStatus;
  planName: string;
  invoiceId: string;
  amount: string;
  creditsCount: number;
  providerName: string;
  dateTime: string;
  /** Only for subscriptions: end of the paid period. */
  expiresAt?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** KMP formatReceiptDateTime: "19 Jun 2025 • 10:15" (24 h, local time). */
export function formatReceiptDateTime(at: Date, monthsFromNow = 0): string {
  const d = new Date(at.getTime());
  if (monthsFromNow) d.setMonth(d.getMonth() + monthsFromNow);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} • ${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** The app's StripePlan.displayPrice(), two decimals: "9.99 USD". */
export const displayPrice = (plan: Pick<StripePlan, "amount" | "currency">): string => `${(plan.amount / 100).toFixed(2)} ${plan.currency.toUpperCase()}`;

/** KMP fallbackInvoiceId: a stable "URT-1234-567890" derived from ids the client already holds (32-bit rolling hash). */
export function fallbackInvoiceId(...parts: Array<string | null | undefined>): string {
  let hash = 0;
  for (const part of parts) {
    if (part == null) continue;
    for (let i = 0; i < part.length; i += 1) hash = (((hash << 5) - hash + part.charCodeAt(i)) | 0);
  }
  const digits = String(hash >>> 0).padStart(10, "0").slice(-10);
  return `URT-${digits.slice(0, 4)}-${digits.slice(4)}`;
}

/** Digits-only stub printed under the barcode (PaymentReceiptUi.barcodeValue). */
export function barcodeValue(invoiceId: string): string {
  const digits = invoiceId.replace(/\D/g, "");
  const base = digits || String([...invoiceId].reduce((sum, c) => sum + c.charCodeAt(0), 0));
  return base.slice(-14).padStart(14, "0");
}

export function buildReceipt(args: { plan: StripePlan; status: string; at: Date; months?: number; invoiceId?: string | null }): ReceiptData {
  const { plan, status, at, months, invoiceId } = args;
  return {
    status: receiptStatusOf(status),
    planName: plan.name,
    invoiceId: invoiceId ?? fallbackInvoiceId(plan.productId, plan.priceId, plan.name),
    amount: displayPrice(plan),
    creditsCount: plan.creditsCount,
    providerName: "Stripe",
    dateTime: formatReceiptDateTime(at),
    expiresAt: months ? formatReceiptDateTime(at, months) : undefined,
  };
}

/** PaymentReceiptUi.toShareText — the plain text handed to the share sheet. */
export function receiptShareText(r: ReceiptData): string {
  return [
    `Archibi — ${RECEIPT_TITLES[r.status]}`,
    "",
    `Plan: ${r.planName}`,
    `Invoice ID: ${r.invoiceId}`,
    `Amount: ${r.amount}`,
    `Credits: ${r.creditsCount}`,
    `Paid with: ${r.providerName}`,
    `Date: ${r.dateTime}`,
    ...(r.expiresAt ? [`Expires: ${r.expiresAt}`] : []),
  ].join("\n");
}
