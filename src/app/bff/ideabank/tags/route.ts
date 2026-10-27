import { z } from "zod";
import { getMainMenuTags } from "@/features/ideabank/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({ type: z.enum(["interior", "exterior", "landscape"]) });

export const GET = bffHandler({ input: Query }, ({ type }) => getMainMenuTags(type));
