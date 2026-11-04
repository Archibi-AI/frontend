import { getRecentProjects } from "@/features/home/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({}, (_input, { session }) => getRecentProjects(session));
