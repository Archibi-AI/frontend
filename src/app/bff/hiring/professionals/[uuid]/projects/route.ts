import { z } from "zod";
import type { ProProject } from "@/features/hiring/schemas";
import { isUuid } from "@/features/hiring/model/types";
import { getProfessionalsProject } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { AppError } from "@/shared/errors/app-error";

export const GET = bffHandler<{ page: number }, { projects: ProProject[] }, { uuid: string }>({ input: z.object({ page: z.coerce.number().int().min(1).default(1) }) }, ({ page }, { params }) => {
  if (!isUuid(params.uuid)) throw new AppError("NOT_FOUND", 404);
  return getProfessionalsProject(page, params.uuid);
});
