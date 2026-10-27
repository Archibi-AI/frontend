import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors/app-error";
import { shouldRetry } from "@/shared/http/query-client";
import { fetchPage, nextPageParam } from "./paging";

describe("paging + query defaults (F10)", () => {
  it("Q1 INVALID_PAGE ends the list", async () => {
    expect(await fetchPage(() => Promise.reject(new AppError("INVALID_PAGE", 404)))).toEqual([]);
    expect(await fetchPage(() => Promise.reject(new AppError("NOT_FOUND", 404)))).toEqual([]);
  });
  it("other errors still throw", async () => {
    await expect(fetchPage(() => Promise.reject(new AppError("SERVER", 500)))).rejects.toMatchObject({ code: "SERVER" });
  });
  it("Q2 empty last page → no next page", () => {
    expect(nextPageParam([], [[1], []])).toBeUndefined();
    expect(nextPageParam([1], [[1], [2]])).toBe(3);
  });
  it("Q3 retry policy: transient retried twice, business errors never", () => {
    expect(shouldRetry(0, new AppError("SERVER", 500))).toBe(true);
    expect(shouldRetry(1, new AppError("NO_INTERNET", 0))).toBe(true);
    expect(shouldRetry(2, new AppError("SERVER", 500))).toBe(false);
    expect(shouldRetry(0, new AppError("OUT_OF_CREDIT", 400))).toBe(false);
  });
});
