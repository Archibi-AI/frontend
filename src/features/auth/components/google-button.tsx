"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

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
    if (!loaded || !clientId || !host.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential), ux_mode: "popup" });
    window.google.accounts.id.renderButton(host.current, { theme: "outline", size: "large", shape: "rectangular", text: "continue_with", width: 380 });
  }, [loaded, clientId, onCredential]);

  if (!clientId) return null;
  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <div ref={host} className={disabled ? "pointer-events-none opacity-50" : undefined} aria-label="Continue with Google" />
    </>
  );
}
