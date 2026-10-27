import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Image hosts are listed explicitly (architecture/09 §6) — collected from real
  // staging responses in the Idea Bank / Hiring / Account plans. No wildcards.
  images: { remotePatterns: [] },
  // typedRoutes stays off until the section pages exist (Phases 2–7); routes.ts is the single
  // source of URLs meanwhile. Re-enable in release/R1 once every linked route is built.
};

export default config;
