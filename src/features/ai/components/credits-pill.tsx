"use client";
import Link from "next/link";
import { MdWorkspacePremium } from "react-icons/md";
import { routes } from "@/shared/config/routes";
import { Skeleton } from "@/shared/ui/skeleton";
import { useCredits } from "./use-ai";

export const creditsText = (n: number) => `${n} ${n === 1 ? "render" : "renders"} left`;

const Divider = () => <span aria-hidden className="mx-1.5 h-3 w-px bg-line" />;

/** AppActionBar.kt RendersPill: `[crown Pro | Free] · N Renders`. The badge is hidden when the backend sends no `is_pro`. */
export function CreditsPill() {
  const { data, isError } = useCredits();
  if (!data && isError) return null; // the top bar stays usable without it
  if (!data) return <Skeleton className="h-7 w-[120px] rounded-pill" />;
  return (
    <Link href={routes.billing.index()} aria-live="polite" className="inline-flex items-center whitespace-nowrap rounded-pill border border-line bg-track px-2.5 py-1.5 text-xs leading-none text-[#585858]">
      {data.is_pro === true && (
        <>
          <MdWorkspacePremium className="mr-[3px] size-3.5 text-brand" aria-hidden />
          <span className="font-semibold text-brand">Pro</span>
          <Divider />
        </>
      )}
      {data.is_pro === false && (
        <>
          <span className="font-semibold text-[#16a34a]">Free</span>
          <Divider />
        </>
      )}
      {data.ai_credits} Renders
    </Link>
  );
}
