import { z } from "zod";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getCategoryProfessionals } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({ category: z.string().regex(/^(\d{1,12}|[0-9a-f-]{36})$/i), page: z.coerce.number().int().min(1).default(1), filters: z.string().max(4000).optional() });
export const GET = bffHandler({ input: Query }, async ({ category, page, filters }, { session }) => {
  const res = await getCategoryProfessionals(category, page, filters, session);
  void rememberProfessionals(res.professionals);
  return res;
});
