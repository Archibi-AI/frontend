import { z } from "zod";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getTagProfessionals } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({ tag: z.string().min(1).max(80), page: z.coerce.number().int().min(1).default(1), filters: z.string().max(4000).optional() });
export const GET = bffHandler({ input: Query }, async ({ tag, page, filters }, { session }) => {
  const res = await getTagProfessionals(tag, page, filters, session);
  void rememberProfessionals(res.professionals);
  return res;
});
