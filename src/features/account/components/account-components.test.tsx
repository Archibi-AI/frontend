import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { server } from "@/test/msw/server";
import { router } from "@/test/navigation-mock";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import type { AccountSummary } from "../schemas";
import { ChangePasswordForm } from "./change-password-form";
import { FavoritesGrid } from "./favorites-grid";
import { ManagePlanPanel } from "./manage-plan-panel";
import { PlanCard } from "./plan-card";
import { PrivacyPanel } from "./privacy-panel";
import { ProjectsGrid } from "./projects-grid";
import { SupportForm } from "./support-form";
import { statusTone, TransactionsList } from "./transactions-list";

setupComponentTest();
const err = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });

const summary = (plan: Partial<AccountSummary["plan"]> = {}, topUp: AccountSummary["topUp"] = null): AccountSummary => ({
  plan: { kind: "subscription", name: "Pro", provider: "stripe", status: "active", rendersRemaining: 38, rendersAllowance: 50, allowancePeriod: "month", renewsOn: "2026-11-20", canUpgrade: false, ...plan },
  topUp, shareText: "Design with Archibi", appVersion: null,
});

describe("PlanCard (Plan & Billing)", () => {
  it("shows plan, allowance, renewal and a progress bar", () => {
    renderWithProviders(<PlanCard summary={summary()} />);
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    expect(screen.getByText("38 of 50 renders left this month")).toBeInTheDocument();
    expect(screen.getByText("Renews on Nov 20, 2026")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "38");
    expect(screen.queryByRole("link", { name: "Upgrade" })).not.toBeInTheDocument();
  });
  it("free plan offers Upgrade; top-up lots are listed", () => {
    const free = summary({ kind: "free", name: "Free", provider: null, rendersAllowance: 0, rendersRemaining: 3, renewsOn: null }, {
      rendersRemaining: 5, nextExpiry: { rendersRemaining: 5, expiresOn: "2026-12-01", monthsLeft: 1 }, lots: [{ rendersRemaining: 5, source: "stripe", expiresOn: "2026-12-01" }],
    });
    renderWithProviders(<PlanCard summary={free} />);
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/billing?section=subscriptions");
    expect(screen.getByText(/5 renders expire on Dec 1, 2026/)).toBeInTheDocument();
  });
});

describe("ChangePasswordForm", () => {
  async function fill(old: string, next: string, confirm: string) {
    await userEvent.type(screen.getByLabelText("Current password"), old);
    await userEvent.type(screen.getByLabelText("New password"), next);
    await userEvent.type(screen.getByLabelText("Confirm new password"), confirm);
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
  }
  it("posts the three fields with the app's names and returns to the account", async () => {
    let body: unknown;
    server.use(http.post("*/bff/account/change-password", async ({ request }) => { body = await request.json(); return HttpResponse.json({ message: "Password has been changed successfully." }); }));
    renderWithProviders(<ChangePasswordForm />);
    await fill("oldpass12", "N3w-pass!word", "N3w-pass!word");
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/account"));
    expect(body).toEqual({ old_password: "oldpass12", new_password: "N3w-pass!word", confirm_password: "N3w-pass!word" });
    expect(await screen.findByText("Password has been changed successfully.")).toBeInTheDocument();
  });
  it("wrong old password is shown under the old-password field", async () => {
    server.use(http.post("*/bff/account/change-password", () => err(400, "WRONG_OLD_PASSWORD", "Old password is Incorrect!")));
    renderWithProviders(<ChangePasswordForm />);
    await fill("badpass12", "N3w-pass!word", "N3w-pass!word");
    expect(await screen.findByText("Old password is Incorrect!")).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("blocks mismatching confirmation with the backend's wording", async () => {
    renderWithProviders(<ChangePasswordForm />);
    await fill("oldpass12", "N3w-pass!word", "something-else");
    expect(await screen.findByText("New and Confirm Password must be the same!")).toBeInTheDocument();
  });
});

describe("PrivacyPanel (PrivacyDataScreen / DangerZoneCard)", () => {
  const info = { privacyControlsText: "Your data stays yours.", helpBeforeDeletingUrl: "https://archibi.ca/faq/", deletionGraceDays: 30, confirmationWord: "DELETE" };
  it("delete stays disabled until the exact word is typed, then schedules deletion", async () => {
    let body: unknown;
    server.use(http.post("*/bff/account/delete", async ({ request }) => { body = await request.json(); return HttpResponse.json({ message: "Your account is scheduled for deletion.", deletionScheduledFor: "2026-11-26T12:00:00Z" }); }));
    renderWithProviders(<PrivacyPanel info={info} />);
    const button = screen.getByRole("button", { name: "Delete my account" });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Type DELETE to confirm"), "delete");
    expect(button).toBeDisabled();
    await userEvent.clear(screen.getByLabelText("Type DELETE to confirm"));
    await userEvent.type(screen.getByLabelText("Type DELETE to confirm"), "DELETE");
    await userEvent.click(button);
    expect(await screen.findByText("Your account is scheduled for deletion.")).toBeInTheDocument();
    expect(body).toEqual({ confirmation: "DELETE" });
    expect(screen.getByText(/Sign in again within 30 days/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/auth/login");
  });
  it("without backend privacy text it links to the real Privacy Policy and invents no claims", () => {
    renderWithProviders(<PrivacyPanel info={{ ...info, privacyControlsText: "" }} />);
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "https://archibi.ca/privacy-policy/");
    expect(screen.queryByText(/never sold/i)).not.toBeInTheDocument();
  });
  it("shows the backend's refusal", async () => {
    server.use(http.post("*/bff/account/delete", () => err(400, "UNKNOWN", "Type DELETE to confirm.")));
    renderWithProviders(<PrivacyPanel info={info} />);
    await userEvent.type(screen.getByLabelText("Type DELETE to confirm"), "DELETE");
    await userEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Type DELETE to confirm.");
  });
});

describe("SupportForm (SupportScreen)", () => {
  it("requires the fields, then opens the mail client with the app's format", async () => {
    const hrefs: string[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { origin: original.origin, set href(v: string) { hrefs.push(v); }, get href() { return ""; } } });
    onTestFinished(() => { Object.defineProperty(window, "location", { configurable: true, value: original }); }); // never leak into other tests
    renderWithProviders(<SupportForm username="a@b.c" defaultName="Abtin" />);
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(screen.getAllByText("Required").length).toBeGreaterThan(0);
    expect(hrefs).toHaveLength(0);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Billing" }));
    await userEvent.type(screen.getByLabelText("Message"), "My invoice is wrong");
    await userEvent.click(screen.getByRole("button", { name: /Send email/ }));
    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toMatch(/^mailto:support@archibi\.ca\?subject=/);
    expect(decodeURIComponent(hrefs[0]!)).toContain("[Archibi web] Billing");
  });
});

describe("ManagePlanPanel (ManagePlanScreen)", () => {
  it("Stripe: confirm → cancel → refreshed summary shows the end date", async () => {
    let cancelled = false;
    server.use(
      http.post("*/bff/billing/subscription/cancel", () => { cancelled = true; return HttpResponse.json({ message: "success", detail: "Subscription will not renew after the current period.", periodEnd: "2026-11-20" }); }),
      http.get("*/bff/account/summary", () => HttpResponse.json(summary({ endsOn: "2026-11-20", renewsOn: null }))),
    );
    renderWithProviders(<ManagePlanPanel initial={summary()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel subscription" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel subscription" }));
    await waitFor(() => expect(cancelled).toBe(true));
    expect(await screen.findByText(/you keep access until Nov 20, 2026/)).toBeInTheDocument();
  });
  it("Stripe: backend 'no active subscription' is explained", async () => {
    server.use(http.post("*/bff/billing/subscription/cancel", () => err(404, "NOT_FOUND", "x")));
    renderWithProviders(<ManagePlanPanel initial={summary()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel subscription" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You have no active subscription to cancel.");
  });
  it("Stripe: gate closed shows the unavailable message", async () => {
    server.use(http.post("*/bff/billing/subscription/cancel", () => err(403, "FORBIDDEN", "subscriptions unavailable")));
    renderWithProviders(<ManagePlanPanel initial={summary()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel subscription" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel subscription" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Subscriptions are not available yet.");
  });
  it("Apple/Google: opens the store's page from the backend URL", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    let provider: string | null = null;
    server.use(http.get("*/bff/billing/subscription/manage-url", ({ request }) => { provider = new URL(request.url).searchParams.get("provider"); return HttpResponse.json({ manageUrl: "https://apps.apple.com/account/subscriptions" }); }));
    renderWithProviders(<ManagePlanPanel initial={summary({ provider: "apple_iap" })} />);
    await userEvent.click(screen.getByRole("button", { name: "Manage in App Store" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("https://apps.apple.com/account/subscriptions", "_blank", "noopener,noreferrer"));
    expect(provider).toBe("apple");
    open.mockRestore();
  });
  it("Free plan links to the plans", () => {
    renderWithProviders(<ManagePlanPanel initial={summary({ kind: "free", name: "Free", provider: null, rendersAllowance: 0, rendersRemaining: 2, renewsOn: null })} />);
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing?section=subscriptions");
  });
});

describe("lists", () => {
  it("transactions: pages until an empty page, status tones", async () => {
    const pages: Record<string, unknown> = {
      "1": { transactions: [{ uuid: "1", code: "PI_a", status: "completed" }, { uuid: "2", code: "PI_b", status: "failed" }] },
    };
    server.use(http.get("*/bff/account/transactions", ({ request }) => {
      const page = new URL(request.url).searchParams.get("page") ?? "1";
      return pages[page] ? HttpResponse.json(pages[page]) : err(404, "INVALID_PAGE", "Invalid page.");
    }));
    renderWithProviders(<TransactionsList />);
    expect(await screen.findByText("PI_a")).toBeInTheDocument();
    expect(screen.getByText("failed")).toHaveClass("text-danger");
    expect(statusTone("pending")).toContain("warning");
    expect(statusTone("???")).toContain("subtle");
  });
  it("transactions: empty state", async () => {
    server.use(http.get("*/bff/account/transactions", () => HttpResponse.json({ transactions: [] })));
    renderWithProviders(<TransactionsList />);
    expect(await screen.findByText("No transactions yet")).toBeInTheDocument();
  });
  it("projects: grid, then empty state with the call to action", async () => {
    server.use(http.get("*/bff/account/projects", () => HttpResponse.json({ generatedImages: [{ uuid: 7, generatedImage: "https://signed.example/7.jpg" }] })));
    const { unmount } = renderWithProviders(<ProjectsGrid />);
    expect(await screen.findByRole("button", { name: "Open project 7" })).toBeInTheDocument();
    unmount();
    server.use(http.get("*/bff/account/projects", () => HttpResponse.json({ generatedImages: [] })));
    renderWithProviders(<ProjectsGrid />);
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start designing" })).toHaveAttribute("href", "/ai");
  });
  it("projects: a server error offers a retry", async () => {
    server.use(http.get("*/bff/account/projects", () => err(500, "SERVER", "Sorry, the service is currently unavailable. Please try again in a few minutes.")));
    renderWithProviders(<ProjectsGrid />);
    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent("currently unavailable");
  }, 15000);
  it("favorites: posts link to the Idea Bank post; empty state links to the Idea Bank", async () => {
    server.use(http.get("*/bff/ideabank/favorites", () => HttpResponse.json({ posts: [{ uuid: 341, image: "https://signed.example/341.jpg", width: 800, height: 600 }] })));
    const { unmount } = renderWithProviders(<FavoritesGrid />);
    expect(await screen.findByRole("link")).toHaveAttribute("href", "/ideabank/post/341");
    unmount();
    server.use(http.get("*/bff/ideabank/favorites", () => HttpResponse.json({ posts: [] })));
    renderWithProviders(<FavoritesGrid />);
    expect(await screen.findByRole("link", { name: "Browse the Idea Bank" })).toHaveAttribute("href", "/ideabank");
  });
});
