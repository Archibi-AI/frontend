import type { Metadata } from "next";
import { StudioForm } from "@/features/ai";

export const metadata: Metadata = { title: "Landscape Design" };

export default function Page() {
  return <StudioForm kind="Landscape" title="Landscape Design" tip="Photograph the whole garden in daylight." />;
}
