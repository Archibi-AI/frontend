"use client";
import Script from "next/script";
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
      <Script src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" strategy="afterInteractive" onLoad={() => setLoaded(true)} />
      <button
        type="button"
        onClick={click}
        disabled={disabled || !loaded}
        className="flex h-[46px] w-full items-center justify-center gap-2 rounded-sm bg-black text-[15px] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
          <path d="M16.37 1.43c0 1.14-.42 2.2-1.25 3.06-.9.94-2 1.48-3.13 1.39a3.2 3.2 0 0 1 1.3-2.75c.8-.6 1.9-1.01 3.08-1.7zM20.9 17.1c-.55 1.26-.82 1.82-1.52 2.93-.99 1.55-2.38 3.48-4.1 3.5-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.72-.02-3.04-1.76-4.03-3.31C-.5 15.7-.78 10.62 1.41 7.8c1.55-2 4-3.17 6.3-3.17 2.34 0 3.81 1.02 5.74 1.02 1.87 0 3.01-1.03 5.71-1.03 2.04 0 4.2 1.11 5.74 3.03-5.04 2.76-4.22 9.95-.0 9.45z" />
        </svg>
        Continue with Apple
      </button>
    </>
  );
}
