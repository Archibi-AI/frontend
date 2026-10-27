import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, toErrorBody } from "./app-error";

describe("AppError", () => {
  it("from(ZodError) → 400 UNKNOWN naming the fields", () => {
    const zerr = z.object({ page: z.number() }).safeParse({}).error;
    const e = AppError.from(zerr);
    expect([e.code, e.status]).toEqual(["UNKNOWN", 400]);
    expect(e.message).toContain("page");
  });
  it("from(plain Error) → 500 SERVER with a generic message", () => {
    const e = AppError.from(new Error("secret stack"));
    expect([e.code, e.status]).toEqual(["SERVER", 500]);
    expect(e.message).not.toContain("secret");
  });
  it("fromBody round-trips toErrorBody", () => {
    const original = new AppError("OUT_OF_CREDIT", 400, "You are out of Credit!");
    const back = AppError.fromBody(toErrorBody(original), 400);
    expect([back.code, back.message]).toEqual(["OUT_OF_CREDIT", "You are out of Credit!"]);
  });
  it("fromBody without an envelope maps by status", () => {
    expect(AppError.fromBody(null, 502).code).toBe("SERVER");
    expect(AppError.fromBody("x", 400).code).toBe("UNKNOWN");
  });
  it("default messages are the app's wording", () => {
    expect(new AppError("PASSWORD_IS_NOT_VALID", 400).message).toBe("Your entered password is wrong.");
  });
});
