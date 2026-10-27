// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors/app-error";
import { loadPage } from "./page-data";

describe("loadPage", () => {
  it("returns the data", async () => expect(await loadPage("/account", async () => 42)).toBe(42));
  it("a dead session redirects to login WITH the reauth marker (breaks the proxy loop)", async () => {
    await expect(loadPage("/account", () => Promise.reject(new AppError("UNAUTHORIZED", 401)))).rejects.toThrow("NEXT_REDIRECT:/auth/login?next=%2Faccount&reauth=1");
  });
  it("other errors reach error.tsx untouched", async () => {
    await expect(loadPage("/account", () => Promise.reject(new AppError("SERVER", 500)))).rejects.toMatchObject({ code: "SERVER" });
  });
});
