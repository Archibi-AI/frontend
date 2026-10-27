import { DeleteInputSchema } from "@/features/account/schemas";
import { requestAccountDeletion } from "@/features/account/server/repository";
import { bffHandler } from "@/server/bff/handler";
import { clearSession } from "@/server/session/cookies";

/** Mirrors PrivacyDataViewModel.requestAccountDeletion: after 202 the local session is cleared like a logout (the backend already revoked every token). */
export const POST = bffHandler({ input: DeleteInputSchema }, async ({ confirmation }, { session }) => {
  const result = await requestAccountDeletion(confirmation, session);
  clearSession(session);
  return result;
});
