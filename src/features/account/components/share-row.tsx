"use client";
import { Share2 } from "lucide-react";
import { AccountButtonRow } from "./account-sections";
import { useToast } from "@/shared/ui/toast";

/** "Share Archibi" — the backend's `shareText` via the Web Share API, falling back to the clipboard. */
export function ShareRow({ text }: { text: string }) {
  const toast = useToast();
  async function share() {
    const message = text || "Design your space with Archibi";
    try {
      if (navigator.share) await navigator.share({ text: message, url: "https://archibi.ca" });
      else {
        await navigator.clipboard.writeText(`${message} https://archibi.ca`);
        toast({ kind: "info", title: "Link copied" });
      }
    } catch {
      /* share sheet dismissed */
    }
  }
  return <AccountButtonRow label="Share Archibi" icon={Share2} onClick={share} />;
}
