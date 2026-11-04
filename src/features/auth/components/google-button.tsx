"use client";
import Script from "next/script";
import { cn } from "@/shared/lib/cn";
import { useEffect, useRef, useState } from "react";

const MIN_WIDTH = 200; // Google renders its own fixed-size iframe: 200 px is its minimum
const MAX_WIDTH = 400;

interface GoogleId {
  initialize(config: { client_id: string; callback: (r: { credential: string }) => void; ux_mode: "popup" }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

/** Google Identity Services — the `credential` is the ID token the app's /google_auth/ endpoint verifies. */
export function GoogleButton({ onCredential, disabled }: { onCredential: (credential: string) => void; disabled?: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const host = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!loaded || !clientId || !el || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential), ux_mode: "popup" });
    // Google draws a fixed-pixel iframe, so redraw it at the column's width (and again if the column resizes).
    let last = 0;
    const draw = () => {
      const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(el.clientWidth)));
      if (width === last || !window.google) return;
      last = width;
      el.replaceChildren();
      window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "rectangular", text: "signin_with", logo_alignment: "left", width });
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded, clientId, onCredential]);

  if (!clientId) return null;
  return (
    <>
      {/* onReady, not onLoad: onLoad fires once per page load, so coming back to this page would leave this empty. */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <div ref={host} className={cn("h-[44px] w-full overflow-hidden [&>div]:!w-full", disabled && "pointer-events-none opacity-50")} aria-label="Sign in with Google" />
    </>
  );
}
