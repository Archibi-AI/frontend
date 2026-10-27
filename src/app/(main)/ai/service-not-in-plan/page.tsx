import type { Metadata } from "next";
import { ServiceNotInPlan } from "@/features/ai";

export const metadata: Metadata = { title: "Not in your plan" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const service = (await searchParams).service;
  return <ServiceNotInPlan service={Array.isArray(service) ? service[0] : service} />;
}
