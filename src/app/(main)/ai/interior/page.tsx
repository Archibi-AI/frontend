import type { Metadata } from "next";
import { StudioForm } from "@/features/ai";

export const metadata: Metadata = { title: "Interior Design" };

export default function Page() {
  return <StudioForm kind="Interior" title="Interior Design" subtitle="Restyle any room from a photo." tip="Use a well-lit photo taken straight on." />;
}
