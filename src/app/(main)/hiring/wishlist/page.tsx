import type { Metadata } from "next";
import { ProfessionalList } from "@/features/hiring";
import { rememberProfessionals } from "@/features/hiring/server/card-cache";
import { getWishlist } from "@/features/hiring/server/repository";
import type { ProfessionalSimple } from "@/features/hiring/schemas";
import { loadPage } from "@/server/page-data";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "My wishlist", robots: { index: false } };

/** hiring/wishlist (H8): the professionals the user saved — shared with the app. Protected by the proxy. */
export default async function WishlistPage() {
  const pros = await loadPage(routes.hiring.wishlist(), () =>
    getWishlist(1).then((r) => r.professionals).catch((e): ProfessionalSimple[] => {
      if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
      throw e;
    }),
  );
  await rememberProfessionals(pros);
  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: "Wishlist" }]} />
      <PageHeading eyebrow="Archibi Pros" title="My wishlist" subtitle="Professionals you saved." />
      <ProfessionalList keyParts={["wishlist"]} path="/bff/hiring/wishlist" query={{}} initial={pros} empty="Your wishlist is empty." />
    </>
  );
}
