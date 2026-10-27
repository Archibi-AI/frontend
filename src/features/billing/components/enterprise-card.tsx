"use client";
import { useState } from "react";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/toast";
import { PaywallText } from "../model/catalog";
import type { EnterpriseContact } from "../schemas";

/** KMP EnterpriseContactCard + requestEnterpriseContactUrl: 200 → open the URL; 503 → "Contact us at support@archibi.ca". */
export function EnterpriseCard() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function contact() {
    setBusy(true);
    setError(undefined);
    try {
      const { url } = await bffFetch<EnterpriseContact>("/bff/billing/enterprise", { method: "POST" });
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast({ kind: "info", title: PaywallText.enterpriseUnset });
    } catch (e) {
      // 503 enterprise_contact_unavailable: nothing is configured yet.
      if (e instanceof AppError && e.status === 503) toast({ kind: "info", title: PaywallText.enterpriseUnset });
      else setError(e instanceof AppError && e.code === "NO_INTERNET" ? "No internet connection. Please try again." : PaywallText.enterpriseError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="enterprise-title" className="rounded-lg border border-line bg-surface p-5 shadow-card md:p-6">
      <h2 id="enterprise-title" className="text-lg font-semibold text-brand">{PaywallText.enterpriseTitle}</h2>
      <p className="mt-1.5 text-sm text-subtle">{PaywallText.enterpriseBody}</p>
      <Button variant="secondary" size="lg" loading={busy} onClick={contact} className="mt-4 w-full rounded-pill border-[1.5px] border-brand normal-case tracking-normal text-brand hover:bg-brand hover:text-white">
        <span className="text-[15px] font-semibold">{PaywallText.enterpriseButton}</span>
      </Button>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  );
}
