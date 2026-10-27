import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import { ShareDialog } from "./share-dialog";
import { downloadName, linkedinUrl, pinterestUrl, telegramUrl, twitterUrl } from "./share-links";

setupComponentTest();
afterEach(() => vi.unstubAllGlobals());
const target = { url: "https://archibi.ca/ideabank/post/7", text: "Look & see", imageUrl: "https://img.example/a b.jpg" };

describe("share links", () => {
  it("build the platforms' intent URLs with encoded params", () => {
    expect(twitterUrl(target)).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Look & see")}&url=${encodeURIComponent(target.url)}`);
    expect(linkedinUrl(target)).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(target.url)}`);
    expect(telegramUrl(target)).toContain("https://t.me/share/url?url=");
    const pin = new URL(pinterestUrl(target));
    expect(pin.searchParams.get("media")).toBe("https://img.example/a b.jpg");
    expect(pin.searchParams.get("description")).toBe("Look & see");
    expect(pinterestUrl({ url: "u", text: "t" })).not.toContain("media=");
  });
  it("names downloads from the title and the image type", () => {
    expect(downloadName("Loft in Toronto!", "https://x/y.PNG?sig=1")).toBe("loft-in-toronto.png");
    expect(downloadName("", "https://x/y")).toBe("archibi-design.jpg");
  });
});

describe("ShareDialog", () => {
  it("lists all six actions, with Download only when there is a picture", () => {
    const { unmount } = renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    for (const n of ["X (Twitter)", "LinkedIn", "Pinterest", "Telegram", "Download", "Copy link"]) expect(screen.getByText(n)).toBeInTheDocument();
    for (const l of screen.getAllByRole("link")) expect(l).toHaveAttribute("target", "_blank");
    unmount();
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} url={target.url} text="t" />);
    expect(screen.queryByText("Download")).not.toBeInTheDocument();
  });
  it("copies the link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    await userEvent.click(screen.getByRole("button", { name: /Copy link/ }));
    expect(writeText).toHaveBeenCalledWith(target.url);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });
  it("download falls back to opening the picture when the host blocks fetching it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("CORS")));
    const open = vi.fn();
    vi.stubGlobal("open", open);
    renderWithProviders(<ShareDialog open onOpenChange={() => {}} {...target} />);
    await userEvent.click(screen.getByRole("button", { name: /Download/ }));
    await waitFor(() => expect(open).toHaveBeenCalledWith(target.imageUrl, "_blank", "noopener,noreferrer"));
  });
});
