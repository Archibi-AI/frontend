"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { Button } from "@/shared/ui/button";
import { ImageDropzone } from "@/shared/ui/image-dropzone";
import { isLocked } from "../model/services";
import { useAiSession } from "./ai-session";
import { creditsText } from "./credits-pill";
import { useCredits } from "./use-ai";

/** furniture/FurnitureFinderScreen: one photo, one button. The job runs server-side (X7 can outlast Cloudflare's 100 s). */
export function FurnitureForm() {
  const router = useRouter();
  const session = useAiSession();
  const credits = useCredits();
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit() {
    if (!file) return;
    if (isLocked(credits.data?.service_access, "furniture_finder")) return router.push(routes.ai.serviceNotInPlan("furniture_finder"));
    setBusy(true);
    setError(undefined);
    const form = new FormData();
    form.set("service", "furniture");
    form.set("beforeImage", file, file.name);
    try {
      const { projectUuid } = await bffFetch<{ projectUuid: string }>("/bff/ai/jobs", { method: "POST", body: form });
      session.setBefore(projectUuid, URL.createObjectURL(file));
      router.push(routes.ai.result(projectUuid));
    } catch (e) {
      setBusy(false);
      const err = e instanceof AppError ? e : new AppError("UNKNOWN", 0);
      if (err.code === "SERVICE_NOT_IN_PLAN") return router.push(routes.ai.serviceNotInPlan("furniture_finder"));
      if (err.code === "OUT_OF_CREDIT") return router.push(routes.ai.outOfCredits());
      if (err.code === "SERVER") return router.push(routes.ai.serverError());
      setError(err.message);
    }
  }

  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-3"><span className="eyebrow-rule" aria-hidden />AI Design Studio</p>
        <h1 className="font-display text-[28px] font-medium leading-tight text-ink-2 md:text-[32px]">Furniture Finder</h1>
        <p className="mt-2 max-w-xl text-[15px] text-subtle">Upload a photo of a room and we find matching furniture you can buy.</p>
      </header>
      <div className="mx-auto max-w-xl">
        <ImageDropzone onFile={(f) => { setFile(f); setError(undefined); }} label="Upload a photo" />
        <p className="mt-3 text-sm text-muted">A clear, well-lit photo of the whole room finds the most pieces.</p>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-muted" aria-live="polite">{credits.data ? creditsText(credits.data.ai_credits) : ""}{!file && <span className="ml-2 text-subtle">Choose a photo to continue.</span>}</p>
          <Button onClick={submit} disabled={!file} loading={busy} size="lg">Find furniture</Button>
        </div>
      </div>
    </>
  );
}
