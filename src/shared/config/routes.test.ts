import { describe, expect, it } from "vitest";
import { isOwnedPath, isProtectedPath, OWNED_PREFIXES, routes, safeNext } from "./routes";

const builders: string[] = [
  routes.auth.login("/account"), routes.auth.signup(), routes.auth.verify("a@b.c"), routes.auth.forgotPassword(), routes.auth.appleCallback(),
  routes.ideabank.index("exterior"), routes.ideabank.tag("Modern", 3), routes.ideabank.post(9),
  routes.hiring.index(), routes.hiring.section("Designer"), routes.hiring.category("Interior", "Designer", "7"), routes.hiring.tag("a/b"),
  routes.hiring.professional("u"), routes.hiring.professionalProjects("u"), routes.hiring.wishlist(),
  routes.ai.index(), routes.ai.interior(), routes.ai.sketch(), routes.ai.result("p"), routes.ai.serviceNotInPlan("interior_design"),
  routes.account.index(), routes.account.privacy(), routes.billing.index(), routes.billing.checkout("subscription", "price_1"),
  routes.billing.result({ status: "completed", kind: "subscription", id: "price_1" }),
];

describe("routes", () => {
  it.each(builders)("%s is under an owned prefix", (url) => {
    expect(isOwnedPath(url.split("?")[0]!)).toBe(true);
  });
  it("encodes special characters", () => {
    expect(routes.hiring.tag("a/b")).toBe("/hiring/tag/a%2Fb");
    expect(routes.auth.verify("a+b@c.d")).toBe("/auth/signup/verify?email=a%2Bb%40c.d");
  });
  it("reauth login URL keeps next and adds the marker", () => {
    expect(routes.auth.reauth("/account")).toBe("/auth/login?next=%2Faccount&reauth=1");
    expect(routes.auth.reauth()).toBe("/auth/login?reauth=1");
  });
  it("billing result omits undefined params", () => {
    expect(routes.billing.result({ status: "failed", kind: "subscription", id: "x" })).toBe("/billing/result?status=failed&kind=subscription&id=x");
  });
  it("protected prefixes", () => {
    expect(isProtectedPath("/account/edit")).toBe(true);
    expect(isProtectedPath("/hiring/wishlist")).toBe(true);
    expect(isProtectedPath("/hiring")).toBe(false);
    expect(isProtectedPath("/accounting")).toBe(false);
  });
  it("/ is protected, without protecting anything else", () => {
    expect(isProtectedPath("/")).toBe(true);
    expect(isOwnedPath("/")).toBe(true);
    expect(isProtectedPath("/ideabank")).toBe(false);
    expect(isOwnedPath("/pricing")).toBe(false);
  });
  it("login to / needs no next", () => expect(routes.auth.login("/")).toBe("/auth/login"));
  it("owned prefixes (10)", () => expect(OWNED_PREFIXES).toHaveLength(10));
  it.each([
    ["https://evil.com", "/"],
    ["//evil.com/x", "/"],
    ["/pricing", "/"],
    ["/bff/session", "/"],
    ["/ideabank", "/ideabank"],
    ["/", "/"],
    ["/hiring/wishlist", "/hiring/wishlist"],
    ["/ai/interior?x=1", "/ai/interior?x=1"],
  ])("safeNext(%s) → %s", (input, expected) => expect(safeNext(input)).toBe(expected));
});
