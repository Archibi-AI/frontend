import type { Metadata } from "next";
import { ServiceHub } from "@/features/ai";

export const metadata: Metadata = { title: "AI Design Studio" };

/** The web twin of the app's Home → Design Studio: same heading, tools, banners and one-liners. */
export default function AiHubPage() {
  return <ServiceHub />;
}
