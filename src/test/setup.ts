import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/headers only works inside a Next request; unit tests use the in-memory double.
vi.mock("next/headers", async () => {
  const { cookieStore, incoming } = await import("./next-headers");
  return { cookies: async () => cookieStore, headers: async () => incoming };
});

// next/navigation needs the app router context; component tests drive this double instead.
vi.mock("next/navigation", async () => {
  const m = await import("./navigation-mock");
  return {
    useRouter: () => m.router,
    useSearchParams: () => m.searchParams(),
    usePathname: () => m.nav.pathname,
    redirect: (to: string) => { throw new Error(`NEXT_REDIRECT:${to}`); },
    notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
  };
});

// jsdom gaps used by Radix primitives and our infinite lists.
class NeverIntersecting {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = NeverIntersecting as unknown as typeof IntersectionObserver;
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = NeverIntersecting as unknown as typeof ResizeObserver;
}
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
}
