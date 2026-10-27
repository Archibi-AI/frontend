"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { routes } from "@/shared/config/routes";
import { AppMessages } from "@/shared/errors/messages";
import { Button, buttonVariants } from "@/shared/ui/button";
import { serviceLabel } from "../model/services";
import { useCredits } from "./use-ai";

function Card({ title, children, actions }: { title: string; children?: ReactNode; actions: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-[28px] font-medium leading-tight text-ink-2">{title}</h1>
      {children && <div className="text-[15px] text-muted">{children}</div>}
      <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

/** OC2: no one-pack offer (the web checkout has none, D14). */
export function OutOfCredits() {
  const { data } = useCredits();
  return (
    <Card title="You're out of renders" actions={<>
      <Link href={routes.billing.index("credits")} className={buttonVariants()}>Get more renders</Link>
      <Link href={routes.billing.index("subscriptions")} className={buttonVariants({ variant: "secondary" })}>See plans</Link>
    </>}>
      {data ? <p>You have {data.ai_credits} {data.ai_credits === 1 ? "render" : "renders"} left.</p> : <p>Top up or pick a plan to keep designing.</p>}
    </Card>
  );
}

/** OC1/OC3: an unknown `service` falls back to generic text. */
export function ServiceNotInPlan({ service }: { service?: string }) {
  const { data } = useCredits();
  const label = service ? serviceLabel(service) : undefined;
  const known = label && label !== service;
  const plan = data?.service_access?.plan_name;
  return (
    <Card title="Not in your plan" actions={<>
      <Link href={routes.billing.index("subscriptions")} className={buttonVariants()}>Upgrade</Link>
      <Link href={routes.ai.index()} className={buttonVariants({ variant: "secondary" })}>Back to AI Studio</Link>
    </>}>
      <p>{known ? `${label} isn't included in your ${plan ? `${plan} ` : ""}plan.` : "This service isn't included in your current plan."}</p>
    </Card>
  );
}

export function AiError() {
  const router = useRouter();
  return (
    <Card title="Something went wrong" actions={<>
      <Button onClick={() => router.back()}>Try again</Button>
      <Link href={routes.ai.index()} className={buttonVariants({ variant: "secondary" })}>AI Studio</Link>
    </>}>
      <p>{AppMessages.somethingWrong}</p>
    </Card>
  );
}

export function AiServerError() {
  const router = useRouter();
  return (
    <Card title="Service unavailable" actions={<Button onClick={() => router.back()}>Try again</Button>}>
      <p>{AppMessages.serverError}</p>
    </Card>
  );
}
