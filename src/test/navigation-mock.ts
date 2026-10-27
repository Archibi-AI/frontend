import { vi } from "vitest";

/** Controllable stand-in for next/navigation in component tests. */
export const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
export const nav = { pathname: "/", search: "" };
export const searchParams = () => new URLSearchParams(nav.search);
export function resetNavigation(): void {
  for (const fn of Object.values(router)) fn.mockReset();
  nav.pathname = "/";
  nav.search = "";
}
