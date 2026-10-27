import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { router } from "@/test/navigation-mock";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import type { ProfessionalSimple } from "../schemas";
import { CategoryGrid } from "./category-grid";
import { FilterPanel } from "./filter-panel";
import { HiringTabs } from "./hiring-tabs";
import { ProfessionalList } from "./professional-list";
import { ProjectTile } from "./project-grid";
import { shareText } from "./project-dialog";
import { WishlistButton } from "./wishlist-button";

setupComponentTest();
afterEach(() => vi.unstubAllGlobals());
const err = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });
const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";
const pro = (uuid: string, fullname: string, over: Partial<ProfessionalSimple> = {}): ProfessionalSimple => ({
  uuid, fullname, profession: "Designer", location: "Toronto", about: "About", image: null, isWishedList: false, ...over,
});

function controllableObserver() {
  const live = new Set<{ cb: IntersectionObserverCallback; on: boolean }>();
  vi.stubGlobal("IntersectionObserver", class {
    private self: { cb: IntersectionObserverCallback; on: boolean };
    constructor(cb: IntersectionObserverCallback) { this.self = { cb, on: true }; live.add(this.self); }
    observe() {} unobserve() {} takeRecords() { return []; }
    disconnect() { this.self.on = false; }
  });
  return () => act(() => { for (const o of live) if (o.on) o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver); });
}

describe("ProfessionalList", () => {
  it("renders page 1, loads the next page, and stops at INVALID_PAGE", async () => {
    const fire = controllableObserver();
    const pages: string[] = [];
    server.use(http.get("*/bff/hiring/category/professionals", ({ request }) => {
      const u = new URL(request.url);
      pages.push(`${u.searchParams.get("category")}|${u.searchParams.get("page")}`);
      return u.searchParams.get("page") === "2" ? HttpResponse.json({ professionals: [pro(U2, "Bob")] }) : err(404, "INVALID_PAGE", "Invalid page.");
    }));
    renderWithProviders(<ProfessionalList keyParts={["t1"]} path="/bff/hiring/category/professionals" query={{ category: U1 }} initial={[pro(U1, "Alice")]} empty="none" />);
    expect(screen.getByRole("link", { name: "Alice" })).toHaveAttribute("href", `/hiring/professional/${U1}`);
    fire();
    expect(await screen.findByRole("link", { name: "Bob" })).toBeInTheDocument();
    fire();
    await waitFor(() => expect(pages).toEqual([`${U1}|2`, `${U1}|3`]));
    fire();
    expect(pages).toHaveLength(2);
  });
  it("shows the empty message", () => {
    renderWithProviders(<ProfessionalList keyParts={["t2"]} path="/bff/hiring/wishlist" query={{}} initial={[]} empty="Your wishlist is empty." />);
    expect(screen.getByText("Your wishlist is empty.")).toBeInTheDocument();
  });
});

describe("WishlistButton", () => {
  it("flips optimistically and shows the backend's message", async () => {
    server.use(http.post(`*/bff/hiring/professionals/${U1}/wishlist`, () => HttpResponse.json({ message: "the professional has been added to your wishlist successfully", added: true })));
    renderWithProviders(<WishlistButton uuid={U1} initial={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to wishlist" }));
    expect(screen.getByRole("button", { name: "Remove from wishlist" })).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByText("the professional has been added to your wishlist successfully")).toBeInTheDocument();
  });
  it("rolls back on failure", async () => {
    server.use(http.post(`*/bff/hiring/professionals/${U1}/wishlist`, () => err(500, "SERVER", "x")));
    renderWithProviders(<WishlistButton uuid={U1} initial={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to wishlist" }));
    expect(await screen.findByText("Couldn't update your wishlist. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to wishlist" })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("HiringTabs / CategoryGrid / FilterPanel", () => {
  it("changing the tab navigates with the lowercase type", async () => {
    renderWithProviders(<HiringTabs type="designer" />);
    await userEvent.click(screen.getByRole("tab", { name: "Landscape" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/hiring?type=landscape", { scroll: false }));
  });
  it("category cards link to hiring/categories/{title}/{section}/{uuid}", () => {
    renderWithProviders(<CategoryGrid section="designer" categories={[{ uuid: U1, title: "Interior Design", image: null }]} />);
    expect(screen.getByRole("link", { name: /Interior Design/ })).toHaveAttribute("href", `/hiring/category/Interior%20Design/designer/${U1}`);
  });
  it("applying filters writes the shareable ?filters= selection", async () => {
    server.use(http.get("*/bff/hiring/filters", () => HttpResponse.json({ filters: [{ title: "tags", options: ["Modern", "Classic"], type: "Optional" }] })));
    renderWithProviders(<FilterPanel scope={{ category: U1 }} selection={{}} pathname="/hiring/x" />);
    await userEvent.click(await screen.findByRole("button", { name: /Filters/ }));
    await userEvent.click(screen.getByRole("button", { name: "Classic" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    const expected = Buffer.from(JSON.stringify({ tags: ["Classic"] })).toString("base64url");
    expect(router.replace).toHaveBeenCalledWith(`/hiring/x?filters=${expected}`, { scroll: false });
  });
});

describe("Project dialog (ProPostScreen)", () => {
  const project = { uuid: 31, image: "https://signed.example/31.jpg", title: "Loft in Toronto", location: "Toronto", description: "Open plan loft." };
  it("a project card opens the popup with title, location and description; Esc closes it", async () => {
    renderWithProviders(<ProjectTile project={project} professionalName="Alice Morgan" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open project Loft in Toronto" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Loft in Toronto");
    expect(dialog).toHaveTextContent("Toronto");
    expect(dialog).toHaveTextContent("Open plan loft.");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("Share opens the share sheet with the app's text", async () => {
    renderWithProviders(<ProjectTile project={project} professionalName="Alice Morgan" />);
    await userEvent.click(screen.getByRole("button", { name: "Open project Loft in Toronto" }));
    await userEvent.click(await screen.findByRole("button", { name: "Share" }));
    const sheet = (await screen.findAllByRole("dialog")).at(-1)!;
    for (const name of ["X (Twitter)", "LinkedIn", "Pinterest", "Telegram", "Download", "Copy link"]) expect(sheet).toHaveTextContent(name);
    expect(screen.getByRole("link", { name: /Telegram/ })).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("designed by Alice Morgan")));
    expect(shareText("Alice Morgan", project)).toBe("Look at the project i found at Archibi designed by Alice Morgan\nLoft in Toronto\nOpen plan loft.");
  });
});
