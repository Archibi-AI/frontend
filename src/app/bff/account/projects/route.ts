import { PageInputSchema } from "@/features/account/schemas";
import { getGalleryPage } from "@/features/account/server/repository";
import { bffHandler } from "@/server/bff/handler";

export const GET = bffHandler({ input: PageInputSchema }, ({ page }, { session }) => getGalleryPage(page, session));
