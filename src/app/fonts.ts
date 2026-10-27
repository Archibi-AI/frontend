import { DM_Sans, Poppins } from "next/font/google";

// Self-hosted at build time by next/font — no runtime request to Google.
// Poppins = Uritect display face (professionals panel); DM Sans = archibi.ca body face.
export const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm-sans", display: "swap" });
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display-face", display: "swap" });
