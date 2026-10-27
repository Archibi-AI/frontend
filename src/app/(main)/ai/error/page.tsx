import type { Metadata } from "next";
import { AiError } from "@/features/ai";

export const metadata: Metadata = { title: "Something went wrong" };
export default function Page() { return <AiError />; }
