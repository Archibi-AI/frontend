import { z } from "zod";
import { getAppleManageUrl, getGoogleManageUrl } from "@/features/billing/server/repository";
import { bffHandler } from "@/server/bff/handler";

const Query = z.object({ provider: z.enum(["apple", "google"]) });

/** The store-managed plans (provider from the account summary) open the store's subscription page. */
export const GET = bffHandler({ input: Query }, ({ provider }, { session }) =>
  provider === "apple" ? getAppleManageUrl(session) : getGoogleManageUrl(session),
);
