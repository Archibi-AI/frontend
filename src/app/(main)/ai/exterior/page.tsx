import type { Metadata } from "next";
import { StudioForm } from "@/features/ai";

export const metadata: Metadata = { title: "Exterior Design" };

export default function Page() {
  return <StudioForm kind="Exterior" title="Exterior Design" subtitle="Reimagine your facade." tip="Photograph the front of the house in daylight." />;
}
