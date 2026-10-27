import { bffHandler } from "@/server/bff/handler";
import { pollJob } from "@/server/ai-jobs/service";
import { ensureFreshAccess } from "@/server/session/refresh";
import { AppError } from "@/shared/errors/app-error";

export const GET = bffHandler<unknown, unknown, { projectUuid: string }>({}, async (_input, { params, session }) => {
  const fresh = await ensureFreshAccess(session);
  if (!fresh) throw new AppError("UNAUTHORIZED", 401);
  return pollJob(params.projectUuid, fresh.user.uuid, session);
});
