import type { Metadata } from "next";
import { FurnitureForm } from "@/features/ai";

export const metadata: Metadata = { title: "Furniture Finder" };

export default function Page() {
  return <FurnitureForm />;
}
