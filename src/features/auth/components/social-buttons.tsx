"use client";
import { useCallback, useState } from "react";
import { AppError } from "@/shared/errors/app-error";
import { AppMessages } from "@/shared/errors/messages";
import { bffFetch, jsonInit } from "@/shared/http/bff-fetch";
import { useFinishSignIn } from "../client/use-auth-actions";
import type { AuthResult } from "../model/user";
import { FormAlert, OrDivider } from "./auth-layout";
import { AppleButton } from "./apple-button";
import { GoogleButton } from "./google-button";

/** Google + Apple, shared by login and signup. Renders nothing when neither is configured (K1/K2). */
export function SocialButtons({ next }: { next: string | null }) {
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const finish = useFinishSignIn(next);
  const hasAny = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_SERVICES_ID);

  const run = useCallback(
    async (path: "/bff/auth/google" | "/bff/auth/apple", body: object) => {
      setError(undefined);
      setBusy(true);
      try {
        await finish(await bffFetch<AuthResult>(path, jsonInit("POST", body)));
      } catch (e) {
        setError(e instanceof AppError ? e.message : AppMessages.somethingWrong);
        setBusy(false);
      }
    },
    [finish],
  );

  const onGoogle = useCallback((credential: string) => run("/bff/auth/google", { credential }), [run]);
  const onApple = useCallback((idToken: string) => run("/bff/auth/apple", { idToken }), [run]);

  if (!hasAny) return null;
  return (
    <>
      <OrDivider />
      <FormAlert>{error}</FormAlert>
      <div className="space-y-3">
        <GoogleButton onCredential={onGoogle} disabled={busy} />
        <AppleButton next={next} onIdToken={onApple} onError={() => setError(AppMessages.somethingWrong)} disabled={busy} />
      </div>
    </>
  );
}
