import { requestEnterpriseContact } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const POST = bffHandler({}, (_input, { session }) => requestEnterpriseContact(session));
