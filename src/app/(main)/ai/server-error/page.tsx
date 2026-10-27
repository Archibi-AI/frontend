import type { Metadata } from "next";
import { AiServerError } from "@/features/ai";

export const metadata: Metadata = { title: "Service unavailable" };
export default function Page() { return <AiServerError />; }
