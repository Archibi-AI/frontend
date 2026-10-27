import { z } from "zod";
import { getUserFilters } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.union([z.object({ category: z.string().regex(/^(\d{1,12}|[0-9a-f-]{36})$/i) }), z.object({ tag: z.string().min(1).max(80) })]);
export const GET = bffHandler({ input: Query }, (q) => getUserFilters(q));
