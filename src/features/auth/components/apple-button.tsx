"use client";
import Script from "next/script";
import { FaApple } from "react-icons/fa6";
import { useState } from "react";

interface AppleAuth {
  init(config: { clientId: string; scope: string; redirectURI: string; state: string; usePopup: boolean }): void;
  signIn(): Promise<{ authorization: { id_token: string; state?: string } }>;
}
declare global {
  interface Window {
    AppleID?: { auth: AppleAuth };
  }
}

const b64url = (value: unknown) => btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Sign in with Apple JS (Services ID, popup). The redirect fallback is /auth/apple/callback. */
export function AppleButton({ next, onIdToken, onError, disabled }: { next: string | null; onIdToken: (idToken: string) => void; onError: () => void; disabled?: boolean }) {
  const servicesId = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID;
  const [loaded, setLoaded] = useState(false);
  if (!servicesId) return null;

  async function click() {
    if (!window.AppleID) return onError();
    const nonce = crypto.randomUUID();
    const state = b64url({ nonce, next });
    window.AppleID.auth.init({ clientId: servicesId as string, scope: "name email", redirectURI: `${window.location.origin}/auth/apple/callback`, state, usePopup: true });
    try {
      const res = await window.AppleID.auth.signIn();
      if (res.authorization.state && res.authorization.state !== state) return onError(); // CSRF check
      onIdToken(res.authorization.id_token);
    } catch {
      onError(); // popup closed or blocked — the user can retry
    }
  }

  return (
    <>
      {/* onReady, not onLoad: onLoad fires once per page load, so coming back to this page would leave the button disabled. */}
      <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" onReady={() => setLoaded(true)} />
      <button
        type="button"
        onClick={click}
        disabled={disabled || !loaded}
        className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-black text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        <FaApple className="size-[18px] shrink-0" aria-hidden />
        <span className="whitespace-nowrap">Sign in with Apple</span>
      </button>
    </>
  );
}
