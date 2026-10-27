import { getAccountSummary } from "@/features/account/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({}, (_input, { session }) => getAccountSummary(session));
