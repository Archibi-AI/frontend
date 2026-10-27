import { PageInputSchema } from "@/features/account/schemas";
import { getFavoritePosts } from "@/features/ideabank/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({ input: PageInputSchema }, ({ page }, { session }) => getFavoritePosts(page, session));
