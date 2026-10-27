import { describe, expect, it } from "vitest";
import { isOwnedPath, isProtectedPath, OWNED_PREFIXES, routes, safeNext } from "./routes";

const builders: string[] = [
  routes.auth.login("/account"), routes.auth.signup(), routes.auth.verify("a@b.c"), routes.auth.forgotPassword(), routes.auth.appleCallback(),
  routes.ideabank.index("exterior"), routes.ideabank.tag("Modern", 3), routes.ideabank.post(9),
  routes.hiring.index(), routes.hiring.section("Designer"), routes.hiring.category("Interior", "Designer", "7"), routes.hiring.tag("a/b"),
  routes.hiring.professional("u"), routes.hiring.professionalProjects("u"), routes.hiring.wishlist(),
  routes.ai.index(), routes.ai.interior(), routes.ai.sketch(), routes.ai.result("p"), routes.ai.serviceNotInPlan("interior_design"),
  routes.account.index(), routes.account.privacy(), routes.billing.index("credits"), routes.billing.checkout("credits", "price_1"),
  routes.billing.result({ status: "completed", kind: "credits", id: "price_1" }),
];

describe("routes", () => {
  it.each(builders)("%s is under an owned prefix", (url) => {
    expect(isOwnedPath(url.split("?")[0]!)).toBe(true);
  });
  it("encodes special characters", () => {
    expect(routes.hiring.tag("a/b")).toBe("/hiring/tag/a%2Fb");
    expect(routes.auth.verify("a+b@c.d")).toBe("/auth/signup/verify?email=a%2Bb%40c.d");
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
  it("owned prefixes match nginx (9)", () => expect(OWNED_PREFIXES).toHaveLength(9));
  it.each([
    ["https://evil.com", "/ideabank"],
    ["//evil.com/x", "/ideabank"],
    ["/pricing", "/ideabank"],
    ["/bff/session", "/ideabank"],
    ["/hiring/wishlist", "/hiring/wishlist"],
    ["/ai/interior?x=1", "/ai/interior?x=1"],
  ])("safeNext(%s) → %s", (input, expected) => expect(safeNext(input)).toBe(expected));
});
