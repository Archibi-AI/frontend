import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { router } from "@/test/navigation-mock";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import type { PostView as PostData } from "../schemas";
import { FavoriteButton } from "./favorite-button";
import { GalleryGrid } from "./gallery-grid";
import { GalleryTabs } from "./gallery-tabs";
import { PostModal } from "./post-modal";
import { PostView } from "./post-view";
import { TagChips } from "./tag-chips";

setupComponentTest();
afterEach(() => vi.unstubAllGlobals());
const err = (status: number, code: string, message: string) => HttpResponse.json({ error: { code, message } }, { status });
const tile = (uuid: number) => ({ uuid, image: `https://signed.example/${uuid}.jpg`, width: 800, height: 600 });

/** Replaces the inert jsdom observer with one the test can fire (the real API calls back when visible). */
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

const post = (over: Partial<PostData> = {}): PostData => ({ uuid: 341, tags: [{ id: 12, tag: "Scandinavian" }], isFavorite: false, likeCount: 0, item: { image: "https://signed.example/341.jpg", width: 800, height: 600 }, ...over });

describe("GalleryGrid (infinite masonry)", () => {
  it("renders the server page, then loads the next page when the sentinel is visible, and stops at INVALID_PAGE", async () => {
    const fire = controllableObserver();
    const requested: string[] = [];
    server.use(http.get("*/bff/ideabank/posts", ({ request }) => {
      const u = new URL(request.url);
      requested.push(`${u.searchParams.get("type")}|${u.searchParams.get("tags")}|${u.searchParams.get("page")}`);
      return u.searchParams.get("page") === "2" ? HttpResponse.json({ posts: [tile(3), tile(4)] }) : err(404, "INVALID_PAGE", "Invalid page.");
    }));
    renderWithProviders(<GalleryGrid type="exterior" tags={[]} initial={[tile(1), tile(2)]} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Open idea 1" })).toHaveAttribute("href", "/ideabank/post/1");
    fire();
    expect(await screen.findByRole("link", { name: "Open idea 4" })).toBeInTheDocument();
    fire();
    await waitFor(() => expect(requested).toEqual(["exterior|null|2", "exterior|null|3"]));
    await waitFor(() => expect(screen.getAllByRole("link")).toHaveLength(4));
    fire();
    expect(requested).toHaveLength(2); // the list ended: no more requests
  });

  it("with tags selected it asks the BFF for the tagged feed", async () => {
    const fire = controllableObserver();
    let tags: string | null = null;
    server.use(http.get("*/bff/ideabank/posts", ({ request }) => { tags = new URL(request.url).searchParams.get("tags"); return HttpResponse.json({ posts: [tile(9)] }); }));
    renderWithProviders(<GalleryGrid type="interior" tags={["12", "15"]} initial={[tile(1)]} />);
    fire();
    await screen.findByRole("link", { name: "Open idea 9" });
    expect(tags).toBe("12,15");
  });

  it("empty feed shows the empty state", () => {
    renderWithProviders(<GalleryGrid type="interior" tags={[]} initial={[]} />);
    expect(screen.getByText("No ideas here yet.")).toBeInTheDocument();
  });

  it("tiles reserve their aspect ratio up front (no layout shift): real size if known, else the app's id-derived bucket", () => {
    renderWithProviders(<GalleryGrid type="interior" tags={[]} initial={[tile(1), { uuid: 2, image: "https://signed.example/2.jpg" }]} />);
    expect(screen.getByRole("link", { name: "Open idea 1" })).toHaveStyle({ aspectRatio: String(800 / 600) });
    expect(screen.getByRole("link", { name: "Open idea 2" })).toHaveStyle({ aspectRatio: "0.84" });
  });
  it("tiles load the light thumbnail when the backend built one, else the full image", () => {
    renderWithProviders(<GalleryGrid type="interior" tags={[]} initial={[{ ...tile(1), thumbnail: "https://signed.example/1.webp" }, tile(2)]} />);
    const srcs = screen.getAllByRole("img", { name: "Design idea" }).map((i) => i.getAttribute("src"));
    expect(srcs).toEqual(["https://signed.example/1.webp", "https://signed.example/2.jpg"]);
  });
});

describe("TagChips / GalleryTabs (URL is the state)", () => {
  const tags = [{ id: 12, tag: "Scandinavian" }, { id: 15, tag: "Minimal" }];
  it("selecting chips builds a shareable URL; Clear removes them", async () => {
    const { rerender } = renderWithProviders(<TagChips type="interior" tags={tags} selected={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Scandinavian" }));
    expect(router.replace).toHaveBeenLastCalledWith("/ideabank?type=interior&tags=12", { scroll: false });
    rerender(<TagChips type="interior" tags={tags} selected={["12"]} />);
    expect(screen.getByRole("button", { name: "Scandinavian" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Minimal" }));
    expect(router.replace).toHaveBeenLastCalledWith("/ideabank?type=interior&tags=12%2C15", { scroll: false });
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(router.replace).toHaveBeenLastCalledWith("/ideabank?type=interior", { scroll: false });
  });
  it("no chips are rendered when the type has no tags", () => {
    renderWithProviders(<TagChips type="interior" tags={[]} selected={[]} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
  it("tabs: Interior · Exterior · Landscape; switching clears the tag selection", async () => {
    renderWithProviders(<GalleryTabs type="interior" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Interior", "Exterior", "Landscape"]);
    expect(screen.getByRole("tab", { name: "Interior" })).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("tab", { name: "Landscape" }));
    expect(router.replace).toHaveBeenCalledWith("/ideabank?type=landscape", { scroll: false });
  });
});

describe("FavoriteButton (posts/screen.kt:222-232)", () => {
  it("flips optimistically, keeps the server answer and shows the app's toast", async () => {
    let release!: () => void;
    server.use(http.post("*/bff/ideabank/posts/341/favorite", async () => { await new Promise<void>((r) => (release = r)); return HttpResponse.json({ isFavorite: true }); }));
    renderWithProviders(<FavoriteButton uuid={341} initial={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
    expect(screen.getByRole("button", { name: "Remove from favorites" })).toHaveAttribute("aria-pressed", "true"); // before the server answered
    release();
    expect(await screen.findByText("Saved to Favorite Ideas")).toBeInTheDocument();
  });
  it("rolls back and shows the app's error text when the server fails", async () => {
    server.use(http.post("*/bff/ideabank/posts/341/favorite", () => err(500, "SERVER", "x")));
    renderWithProviders(<FavoriteButton uuid={341} initial={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
    expect(await screen.findByText("Couldn't update your favorites. Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to favorites" })).toHaveAttribute("aria-pressed", "false");
  });
  it("signed out: rolls back silently (bffFetch sends the user to login) — no error toast", async () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { origin: original.origin, pathname: "/ideabank/post/341", search: "", assign } });
    try {
      server.use(http.post("*/bff/ideabank/posts/341/favorite", () => err(401, "UNAUTHORIZED", "Your session has ended. Please sign in again.")));
      renderWithProviders(<FavoriteButton uuid={341} initial={false} />);
      await userEvent.click(screen.getByRole("button", { name: "Add to favorites" }));
      await waitFor(() => expect(assign).toHaveBeenCalledWith("/auth/login?next=%2Fideabank%2Fpost%2F341"));
      expect(screen.queryByText(/Couldn't update/)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add to favorites" })).toHaveAttribute("aria-pressed", "false");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });
});

describe("PostView / PostModal", () => {
  it("shows the image, style tags linking to tag pages, favorite and share — and no Play Store link", () => {
    renderWithProviders(<PostView post={post()} />);
    expect(screen.getByRole("img", { name: "Design idea" })).toHaveAttribute("src", "https://signed.example/341.jpg");
    expect(screen.getByRole("link", { name: "Scandinavian" })).toHaveAttribute("href", "/ideabank/tag/Scandinavian/12");
    expect(screen.getByRole("button", { name: "Add to favorites" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Share/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open full size/ })).toHaveAttribute("target", "_blank");
    expect(screen.queryByText(/play\.google|Google Play/i)).not.toBeInTheDocument();
  });
  it("without a remembered picture it says so honestly and offers no image actions", () => {
    renderWithProviders(<PostView post={post({ item: null })} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/isn't available here/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open full size/ })).not.toBeInTheDocument();
  });
  it("an already-favorited post starts as 'Remove from favorites'", () => {
    renderWithProviders(<PostView post={post({ isFavorite: true })} />);
    expect(screen.getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument();
  });
  it("Share opens the sheet (X, LinkedIn, Pinterest, Telegram, Download, Copy link) for this idea's page and picture", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderWithProviders(<PostView post={post()} />);
    await userEvent.click(screen.getByRole("button", { name: /Share/ }));
    const sheet = await screen.findByRole("dialog");
    for (const name of ["X (Twitter)", "LinkedIn", "Pinterest", "Telegram", "Download", "Copy link"]) expect(within(sheet).getByText(name)).toBeInTheDocument();
    const pinterest = new URL(within(sheet).getByRole("link", { name: /Pinterest/ }).getAttribute("href")!);
    expect(pinterest.searchParams.get("url")).toBe(`${window.location.origin}/ideabank/post/341`);
    expect(pinterest.searchParams.get("media")).toBe("https://signed.example/341.jpg");
    await userEvent.click(within(sheet).getByRole("button", { name: /Copy link/ }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/ideabank/post/341`);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });
  it("modal: loads the post from the BFF, and Esc returns to the feed", async () => {
    server.use(http.get("*/bff/ideabank/posts/341", () => HttpResponse.json(post())));
    renderWithProviders(<PostModal uuid={341} />);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("link", { name: "Scandinavian" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(router.back).toHaveBeenCalled();
  });
  it("modal: a failure offers a retry instead of an empty dialog", async () => {
    server.use(http.get("*/bff/ideabank/posts/341", () => err(500, "SERVER", "Sorry, the service is currently unavailable. Please try again in a few minutes.")));
    renderWithProviders(<PostModal uuid={341} />);
    expect(await screen.findByText(/currently unavailable/, {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  }, 15000);
});
