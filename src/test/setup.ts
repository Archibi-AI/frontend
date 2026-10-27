import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// next/headers only works inside a Next request; unit tests use the in-memory double.
vi.mock("next/headers", async () => {
  const { cookieStore, incoming } = await import("./next-headers");
  return { cookies: async () => cookieStore, headers: async () => incoming };
});
