import type { Metadata } from "next";
import { OutOfCredits } from "@/features/ai";

export const metadata: Metadata = { title: "Out of renders" };
export default function Page() { return <OutOfCredits />; }
