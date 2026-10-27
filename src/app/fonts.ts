import { DM_Sans, Roboto } from "next/font/google";

// Self-hosted at build time by next/font — no runtime request to Google.
export const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm-sans", display: "swap" });
export const roboto = Roboto({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-roboto", display: "swap" });
