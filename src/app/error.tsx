"use client";
import { AppMessages } from "@/shared/errors/messages";
import { Container } from "@/shared/layout/container";
import { ErrorState } from "@/shared/ui/error-state";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (error.digest) console.error(JSON.stringify({ level: "error", src: "route-error", digest: error.digest }));
  return (
    <Container>
      <ErrorState message={AppMessages.somethingWrong} onRetry={reset} />
    </Container>
  );
}
