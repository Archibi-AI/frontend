import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import { AISubmitResponseSchema, CreditsSchema, DynamicConfigSchema, FilterResponseSchema, SubmitResponseSchema } from "../schemas";

// Function names equal the Ktor data-source methods (AIKtorRemoteDataSource, AccountKtorRemoteDataSource).

const process = (path: string) => (form: FormData, session: SessionWriter) =>
  djangoFetch({ method: "POST", path, body: { kind: "multipart", form }, auth: "required", schema: DynamicConfigSchema, session, timeoutMs: 60_000 });

export const processCreativeRedesignRequest = process("ai/creative-redesign/process/");
export const processBeautifulRedesignRequest = process("ai/beautiful-redesign/process/");
export const processSketchToRenderRequest = process("ai/sketch-to-render/process/");

const save = (path: string) => (projectUuid: string, output: string, session: SessionWriter) =>
  djangoFetch({ method: "POST", path, body: { kind: "form", fields: { output, "project-uuid": projectUuid } }, auth: "required", schema: SubmitResponseSchema, session, timeoutMs: 60_000 });

export const saveReplicateRedesignResponse = save("ai/redesign/save/");
export const saveSketchToRenderResponse = save("ai/sketch-to-render/save/");

export const getRedesignFilters = (part: string, section: string) =>
  djangoFetch({ method: "GET", path: "ai/design/filters/", query: { part, section }, auth: "none", schema: FilterResponseSchema });

export const getCreditsCount = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema: CreditsSchema, session });

/** Run by the job runner with an access token captured at start (Django authenticates at request start). */
export const submitFurnitureFinder = (form: FormData, access: string, userUuid: string) =>
  djangoFetch({
    method: "POST",
    path: "ai/furniture-finder/submit/",
    body: { kind: "multipart", form },
    auth: "required",
    accessOverride: { access, userUuid },
    schema: AISubmitResponseSchema,
    timeoutMs: 300_000,
  });
