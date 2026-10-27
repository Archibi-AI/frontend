import { z } from "zod";
import { getRedesignFilters } from "@/features/ai/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({ part: z.enum(["Interior", "Exterior", "Landscape"]), section: z.enum(["beautiful", "creative", "sketch-to-render"]) });

export const GET = bffHandler({ input: Query }, ({ part, section }) => getRedesignFilters(part, section));
