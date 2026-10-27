import "server-only";
import { z } from "zod";
import {
  getCreditsCount,
  processBeautifulRedesignRequest,
  processCreativeRedesignRequest,
  processSketchToRenderRequest,
  saveReplicateRedesignResponse,
  saveSketchToRenderResponse,
  submitFurnitureFinder,
} from "@/features/ai/server/repository";
import { FilterSummarySchema, OPTIONAL_PARAMS, SERVICES, type JobView, type Service } from "@/features/ai/schemas";
import { isLocked, serviceById } from "@/features/ai/model/services";
import type { SessionWriter } from "@/server/session/cookies";
import { ensureFreshAccess } from "@/server/session/refresh";
import { AppError } from "@/shared/errors/app-error";
import { isDataError } from "@/shared/errors/data-error";
import { defaultMessage } from "@/shared/errors/messages";
import { MAX_UPLOAD_BYTES } from "@/shared/ui/image-dropzone";
import { buildDjangoForm } from "./build-form";
import { startFurnitureCall, startProviderCall } from "./runner";
import { acquireSaveLock, createJob, patchJob, readJob, type JobRecord } from "./store";

const IMAGE_TYPES = /^image\/(jpeg|png|webp|heic|heif)$/i;
export const STALE_RUNNING_MS = 10 * 60_000;
export const STALE_SAVING_MS = 150_000;

const text = z.string().max(500).optional();
const StartSchema = z.object({
  service: z.enum(SERVICES),
  mode: z.enum(["beautiful", "creative"]).default("beautiful"),
  sketchPart: z.enum(["Interior", "Exterior", "Landscape"]).optional(),
  roomType: text, designStyle: text, houseAngle: text, gardenType: text, prompt: text,
  colorPaletteId: z.string().regex(/^\d*$/).optional(), ceilingMaterialId: z.string().regex(/^\d*$/).optional(),
  wallMaterialId: z.string().regex(/^\d*$/).optional(), floorMaterialId: z.string().regex(/^\d*$/).optional(),
  facadeMaterialId: z.string().regex(/^\d*$/).optional(), pathMaterialId: z.string().regex(/^\d*$/).optional(),
  filterSummary: z.string().max(8000).optional(),
});

/** Carries the service key to the browser so SERVICE_NOT_IN_PLAN can route to /ai/service-not-in-plan?service=. */
export class StartError extends AppError {
  constructor(code: AppError["code"], status: number, public readonly serviceKey?: string, message?: string) {
    super(code, status, message);
  }
}

export async function startJob(form: FormData, session: SessionWriter): Promise<{ projectUuid: string }> {
  const file = form.get("beforeImage");
  const raw: Record<string, string> = {};
  form.forEach((v, k) => { if (typeof v === "string") raw[k] = v; });
  const input = StartSchema.parse(raw);
  if (!(file instanceof File) || file.size === 0) throw new AppError("UNKNOWN", 400, "Please choose a photo to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("UNKNOWN", 400, "Image is too large (max 15 MB).");
  if (!IMAGE_TYPES.test(file.type)) throw new AppError("UNKNOWN", 400, "Please upload a JPG, PNG, WebP or HEIC image.");
  if (input.service === "sketch" && !input.sketchPart) throw new AppError("UNKNOWN", 400, "Choose Interior, Exterior or Landscape.");

  const fresh = await ensureFreshAccess(session);
  if (!fresh) throw new AppError("UNAUTHORIZED", 401);
  const owner = fresh.user.uuid;
  const key = serviceById(input.service).key;
  const filters = JSON.stringify(FilterSummarySchema.catch([]).parse(safeJson(input.filterSummary)));

  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) if (typeof v === "string") values[k] = v;
  const djangoForm = buildDjangoForm({ service: input.service, mode: input.mode, sketchPart: input.sketchPart, values, file });
  void OPTIONAL_PARAMS;

  try {
    if (input.service === "furniture") {
      // Pre-check like the app's synchronous call would answer: plan first, then credits (views.py:2102-2141).
      const credits = await getCreditsCount(session);
      if (isLocked(credits.service_access, key)) throw new AppError("SERVICE_NOT_IN_PLAN", 400);
      if (credits.ai_credits === 0) throw new AppError("OUT_OF_CREDIT", 400);
      const id = crypto.randomUUID();
      await createJob(id, { owner, service: "furniture", mode: "-", state: "PROVIDER_RUNNING", filters });
      void startFurnitureCall(id, () => submitFurnitureFinder(djangoForm, fresh.access, owner));
      return { projectUuid: id };
    }
    const process = input.service === "sketch" ? processSketchToRenderRequest : input.mode === "creative" ? processCreativeRedesignRequest : processBeautifulRedesignRequest;
    const cfg = await process(djangoForm, session);
    await createJob(cfg.project_uuid, { owner, service: input.service, mode: input.service === "sketch" ? "-" : input.mode, state: "PROVIDER_RUNNING", filters });
    void startProviderCall(cfg);
    return { projectUuid: cfg.project_uuid };
  } catch (e) {
    const err = AppError.from(e);
    throw new StartError(err.code, err.status, key, err.message);
  }
}

function safeJson(s: string | undefined): unknown {
  try { return s ? JSON.parse(s) : []; } catch { return []; }
}

const codeOf = (c: string | undefined) => (c && isDataError(c) ? c : "UNKNOWN");
const failedView = (rec: JobRecord, code?: string, message?: string): JobView => {
  const c = codeOf(code);
  return { state: "failed", service: rec.service, filters: JSON.parse(rec.filters), error: { code: c, message: message || defaultMessage(c) } };
};

/** The poll state machine of architecture/07 §3 / result plan A5. Never returns provider url, headers, body or raw output. */
export async function pollJob(id: string, ownerUuid: string, session: SessionWriter): Promise<JobView> {
  let rec = await readJob(id);
  if (!rec || rec.owner !== ownerUuid) throw new AppError("NOT_FOUND", 404);
  const age = Date.now() - rec.updatedAt;
  if (rec.state === "PROVIDER_RUNNING" && age > STALE_RUNNING_MS) {
    await patchJob(id, { state: "FAILED", errorCode: "SERVER" }); // a restart killed the runner; no credit lost (save never ran)
    rec = { ...rec, state: "FAILED", errorCode: "SERVER" };
  }
  if (rec.state === "SAVING" && age > STALE_SAVING_MS) {
    await patchJob(id, { state: "PROVIDER_DONE" }); // crashed saver: its lock (120 s) has expired
    rec = { ...rec, state: "PROVIDER_DONE" };
  }
  const base = { service: rec.service, filters: JSON.parse(rec.filters) as JobView["filters"] };
  switch (rec.state) {
    case "PROVIDER_RUNNING":
      return { state: "running", startedAt: rec.createdAt, ...base };
    case "SAVING":
      return { state: "saving", ...base };
    case "DONE":
      return { state: "done", result: JSON.parse(rec.result ?? "{}"), ...base };
    case "FAILED":
      return failedView(rec, rec.errorCode, rec.errorMessage);
    case "PROVIDER_DONE": {
      if (!(await acquireSaveLock(id))) return { state: "saving", ...base };
      await patchJob(id, { state: "SAVING" });
      try {
        const save = rec.service === "sketch" ? saveSketchToRenderResponse : saveReplicateRedesignResponse;
        const result = await save(id, rec.providerOutput ?? "", session);
        await patchJob(id, { state: "DONE", result: JSON.stringify(result) });
        return { state: "done", result, ...base };
      } catch (e) {
        const err = AppError.from(e);
        // save 400 / 404 -> /ai/error, 5xx -> /ai/server-error (architecture/07 §4)
        const code = err.code === "SERVER" || err.code === "REQUEST_TIMEOUT" ? "SERVER" : "UNKNOWN";
        await patchJob(id, { state: "FAILED", errorCode: code });
        return failedView(rec, code);
      }
    }
  }
}

export type { Service };
