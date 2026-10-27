import { z } from "zod";
import { getMainMenuCategories } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({ input: z.object({ type: z.enum(["designer", "constructor", "landscape"]).default("designer") }) }, ({ type }) =>
  getMainMenuCategories(type),
);
