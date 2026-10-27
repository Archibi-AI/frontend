import { NextResponse } from "next/server";
import { bffHandler } from "@/server/bff/handler";
import { recentJobs } from "@/server/ai-jobs/store";
import { startJob, StartError } from "@/server/ai-jobs/service";
import { ensureFreshAccess } from "@/server/session/refresh";
import { AppError, toErrorBody } from "@/shared/errors/app-error";

/** X10 start: validates the upload, calls the process endpoint, then runs the provider call server-side (architecture/07). */
export const POST = bffHandler({ inputFrom: "form" }, async (form, { session }) => {
  try {
    const { projectUuid } = await startJob(form as FormData, session);
    return NextResponse.json({ projectUuid }, { status: 202 });
  } catch (e) {
    if (e instanceof StartError && e.code === "SERVICE_NOT_IN_PLAN") {
      return NextResponse.json({ ...toErrorBody(e), service: e.serviceKey }, { status: e.status });
    }
    throw e;
  }
});

/** Recent jobs (max 20) so the hub can show "in progress" after a reload. */
export const GET = bffHandler({}, async (_input, { session }) => {
  const fresh = await ensureFreshAccess(session);
  if (!fresh) throw new AppError("UNAUTHORIZED", 401);
  return recentJobs(fresh.user.uuid);
});
