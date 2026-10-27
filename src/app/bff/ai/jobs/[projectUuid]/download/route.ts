import { NextResponse } from "next/server";
import { bffHandler } from "@/server/bff/handler";
import { readJob } from "@/server/ai-jobs/store";
import { ensureFreshAccess } from "@/server/session/refresh";
import { AppError } from "@/shared/errors/app-error";

/** Streams the finished render with an attachment filename. Only the URL stored in the caller's own job is fetched. */
export const GET = bffHandler<unknown, unknown, { projectUuid: string }>({}, async (_input, { params }) => {
  const fresh = await ensureFreshAccess();
  if (!fresh) throw new AppError("UNAUTHORIZED", 401);
  const rec = await readJob(params.projectUuid);
  if (!rec || rec.owner !== fresh.user.uuid || rec.state !== "DONE" || rec.service === "furniture") throw new AppError("NOT_FOUND", 404);
  const output = (JSON.parse(rec.result ?? "{}") as { output?: string }).output;
  if (!output || !/^https?:\/\//.test(output)) throw new AppError("NOT_FOUND", 404);
  const upstream = await fetch(output, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) throw new AppError("NOT_FOUND", 404);
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Content-Disposition": `attachment; filename="archibi-${rec.service}-${params.projectUuid.slice(0, 8)}.jpg"`,
    },
  });
});
