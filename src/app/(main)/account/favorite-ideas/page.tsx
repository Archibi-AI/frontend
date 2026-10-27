import type { Metadata } from "next";
import { FavoritesGrid } from "@/features/account/components/favorites-grid";
import { PageHeading } from "@/shared/layout/page-heading";

export const metadata: Metadata = { title: "Favorite Ideas" };

export default function FavoriteIdeasPage() {
  return (
    <>
      <PageHeading eyebrow="Account" title="Favorite Ideas" subtitle="Ideas you saved from the Idea Bank." />
      <FavoritesGrid />
    </>
  );
}
