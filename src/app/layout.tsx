import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Shell } from "./_shell/shell";
import { dmSans, poppins } from "./fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://archibi.ca"),
  title: { default: "Archibi", template: "%s — Archibi" },
  description: "AI interior, exterior and landscape design, an idea bank of real projects, and pros to build it.",
};

export const viewport: Viewport = { themeColor: "#e70039", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(dmSans.variable, poppins.variable)}>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
