import { getMainMenuHeader } from "@/features/hiring/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({}, () => getMainMenuHeader());
