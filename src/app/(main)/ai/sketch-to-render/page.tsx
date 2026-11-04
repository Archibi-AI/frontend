import type { Metadata } from "next";
import { StudioForm } from "@/features/ai";

export const metadata: Metadata = { title: "Sketch to Render" };

export default function Page() {
  return <StudioForm kind="sketch" title="Sketch to Render" tip="Clean lines on white paper give the best results." />;
}
