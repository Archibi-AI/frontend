import type { Metadata } from "next";
import { HomePage } from "@/features/home";
import { Container } from "@/shared/layout/container";

export const metadata: Metadata = { title: "Home", robots: { index: false, follow: false } };
/** Never a cacheable static page: a CDN copy would skip the proxy's sign-in check. */
export const dynamic = "force-dynamic";

/** Signed-in only: the proxy sends everyone else to the login page. */
export default function Home() {
  return (
    <Container className="py-6 md:py-10">
      <HomePage />
    </Container>
  );
}
