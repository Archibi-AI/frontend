import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import { ShareDialog } from "./share-dialog";
import { downloadName, facebookUrl, linkedinUrl, pinterestUrl, telegramUrl, twitterUrl } from "./share-links";

setupComponentTest();
afterEach(() => vi.unstubAllGlobals());
const target = { url: "https://archibi.ca/ideabank/post/7", text: "Look & see", imageUrl: "https://img.example/a b.jpg" };

describe("share links", () => {
  it("build the platforms' intent URLs with encoded params", () => {
    expect(twitterUrl(target)).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Look & see")}&url=${encodeURIComponent(target.url)}`);
    expect(linkedinUrl(target)).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(target.url)}`);
    expect(facebookUrl(target)).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(target.url)}`);
    expect(telegramUrl(target)).toContain("https://t.me/share/url?url=");
    const pin = new URL(pinterestUrl(target));
    expect(pin.searchParams.get("media")).toBe("https://img.example/a b.jpg");
    expect(pin.searchParams.get("description")).toBe("Look & see");
    expect(pinterestUrl({ url: "u", text: "t" })).not.toContain("media=");
  });
  it("names downloads from the title and the image type", () => {
    expect(downloadName("Loft in Toronto!", "https://x/y.PNG?sig=1")).toBe("loft-in-toronto.png");
    expect(downloadName("", "https://x/y")).toBe("archibi-design.jpg");
    expect(downloadName("Idea", "https://x/full/1.svg", "image/svg+xml")).toBe("idea.svg");
    expect(downloadName("Idea", "https://x/blob", "image/webp; charset=x")).toBe("idea.webp");
  });
});

describe("ShareDialog", () => {
  it("shows the five networks in one row plus Download and Copy link (Download only with a picture)", () => {
    const { unmount } = renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    const row = screen.getAllByRole("link");
    expect(row.map((l) => l.getAttribute("aria-label"))).toEqual(["X", "Facebook", "LinkedIn", "Pinterest", "Telegram"]);
    for (const l of row) expect(l).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("button", { name: /Download/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
    unmount();
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} url={target.url} text="t" />);
    expect(screen.queryByRole("button", { name: /Download/ })).not.toBeInTheDocument();
  });
  it("copies the link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    await userEvent.click(screen.getByRole("button", { name: /Copy link/ }));
    expect(writeText).toHaveBeenCalledWith(target.url);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });
  it("Download saves straight away through the same-origin proxy (no new tab)", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string) => { calls.push(u); return new Response(new Blob(["x"], { type: "image/jpeg" })); }));
    const open = vi.fn();
    vi.stubGlobal("open", open);
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} title="Loft" {...target} />);
    await userEvent.click(screen.getByRole("button", { name: /Download/ }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(calls[0]).toMatch(/^\/bff\/download\?url=/);
    expect(open).not.toHaveBeenCalled();
    click.mockRestore();
  });
  it("a failed download says so instead of opening a tab", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no", { status: 502 })));
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    await userEvent.click(screen.getByRole("button", { name: /Download/ }));
    expect(await screen.findByText("Couldn't download the image. Please try again.")).toBeInTheDocument();
  });
});
