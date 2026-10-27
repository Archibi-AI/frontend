import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { AppError } from "./app-error";
import { mapDjangoResponse, mapNetworkError } from "./map-response";

const schema = z.object({ ok: z.boolean() });
const res = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

async function codeOf(status: number, body: unknown) {
  try {
    await mapDjangoResponse(res(status, body), schema);
    return "NO_ERROR";
  } catch (e) {
    return (e as AppError).code;
  }
}

// architecture/08 §2 — one row per rule, in the app's order (HttpClientExt.kt:79-171)
const rows: Array<[string, number, unknown, string]> = [
  ["2xx valid", 200, { ok: true }, "NO_ERROR"],
  ["2xx schema mismatch", 200, { nope: 1 }, "SERIALIZATION"],
  ["408", 408, {}, "REQUEST_TIMEOUT"],
  ["429", 429, {}, "TOO_MANY_REQUESTS"],
  ["400 service_not_in_plan code", 400, { code: "service_not_in_plan", message: "x" }, "SERVICE_NOT_IN_PLAN"],
  ["400 wrong username (api/mobile/views.py)", 400, { message: "Access denied: wrong username." }, "USERNAME_IS_NOT_VALID"],
  ["400 wrong username or password → username wins (app order)", 400, { message: "Access denied: wrong username or password." }, "USERNAME_IS_NOT_VALID"],
  ["400 wrong password", 400, { message: "Access denied: wrong password." }, "PASSWORD_IS_NOT_VALID"],
  ["400 old password (exact)", 400, { message: "Old password is Incorrect!" }, "WRONG_OLD_PASSWORD"],
  ["400 old password (different case is NOT exact)", 400, { message: "old password is incorrect!" }, "UNKNOWN"],
  ["400 code is wrong", 400, { message: "Your code is wrong!" }, "WRONG_VERIFICATION_CODE"],
  ["400 out of credit (ai/mobile/views.py:289)", 400, { message: "You are out of Credit!" }, "OUT_OF_CREDIT"],
  ["400 repeated email", 400, { message: "email is already exist!" }, "REPEATED_EMAIL"],
  ["400 user not exist (Message.kt:49)", 400, { message: "this user does not exist!" }, "USER_NOT_EXIST"],
  ["400 other", 400, { message: "Please make sure that you provided every fields!" }, "UNKNOWN"],
  ["400 unparsable", 400, "<html>", "SERIALIZATION"],
  ["401", 401, {}, "UNAUTHORIZED"],
  ["403", 403, { detail: "Subscriptions are not yet available.", code: "subscriptions_unavailable" }, "FORBIDDEN"],
  ["404 invalid page", 404, { detail: "Invalid page." }, "INVALID_PAGE"],
  ["404 forget-password email", 404, { message: "You do not have account with this email" }, "EMAIL_IS_NOT_VALID_FORGET_PASSWORD"],
  ["404 other", 404, { message: "this professional doesn't exist" }, "NOT_FOUND"],
  ["404 html body", 404, "<html>", "NOT_FOUND"],
  ["500", 500, {}, "SERVER"],
  ["503", 503, { message: "enterprise_contact_unavailable" }, "SERVER"],
  ["418 else", 418, {}, "UNKNOWN"],
];

describe("mapDjangoResponse (architecture/08 §2)", () => {
  it.each(rows)("%s", async (_name, status, body, expected) => {
    expect(await codeOf(status, body)).toBe(expected);
  });

  it("keeps the backend message for unknown 400s (shown verbatim by screens)", async () => {
    const e = await mapDjangoResponse(res(400, { message: "This email belongs to an account that is scheduled for deletion. Sign in to restore it." }), schema).catch((x) => x);
    expect(e.message).toContain("scheduled for deletion");
  });

  it("uses the app wording for 403 subscriptions_unavailable", async () => {
    const e = await mapDjangoResponse(res(403, { code: "subscriptions_unavailable" }), schema).catch((x) => x);
    expect(e.message).toBe("subscriptions unavailable");
  });
});

describe("mapNetworkError", () => {
  it("timeout", () => expect(mapNetworkError(Object.assign(new Error(), { name: "TimeoutError" })).code).toBe("REQUEST_TIMEOUT"));
  it("other network failure", () => expect(mapNetworkError(new TypeError("fetch failed")).code).toBe("NO_INTERNET"));
});
