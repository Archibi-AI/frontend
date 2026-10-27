import type { Metadata } from "next";
import { TransactionsList } from "@/features/account/components/transactions-list";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return (
    <>
      <PageHeading eyebrow="Account" title="Transactions" subtitle="Your purchases and their status." />
      <TransactionsList />
    </>
  );
}
