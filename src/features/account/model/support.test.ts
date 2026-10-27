import { describe, expect, it } from "vitest";
import { supportMailto } from "./support";

describe("supportMailto", () => {
  it("builds the app's email with a web subject", () => {
    const url = supportMailto({ name: " Abtin ", topic: "Billing", message: " Hello there ", username: "a@b.c" });
    expect(url.startsWith("mailto:support@archibi.ca?subject=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("[Archibi web] Billing");
    expect(decodeURIComponent(url)).toContain("Hello there\n\n—\nName: Abtin\nUsername: a@b.c\nApp: web");
  });
  it("Others includes the specified text", () => {
    const url = decodeURIComponent(supportMailto({ name: "n", topic: "Others", other: "Invoice", message: "m", username: "u" }));
    expect(url).toContain("[Archibi web] Others: Invoice");
  });
});
