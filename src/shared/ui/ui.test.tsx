import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";
import { ImageDropzone } from "./image-dropzone";
import { InfiniteSentinel } from "./infinite-list";

describe("design system (F02)", () => {
  it("Button loading sets aria-busy and disables", () => {
    render(<Button loading>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toHaveAttribute("aria-busy", "true");
    expect(b).toBeDisabled();
  });

  it("ImageDropzone rejects files over the limit and accepts images", async () => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:preview");
    globalThis.URL.revokeObjectURL = vi.fn();
    const onFile = vi.fn();
    render(<ImageDropzone onFile={onFile} maxBytes={10} />);
    const input = screen.getByLabelText("Upload a photo");
    await userEvent.upload(input, new File(["x".repeat(20)], "big.png", { type: "image/png" }));
    expect(screen.getByRole("alert")).toHaveTextContent("too large");
    expect(onFile).not.toHaveBeenCalled();
    await userEvent.upload(input, new File(["x"], "ok.png", { type: "image/png" }));
    expect(onFile).toHaveBeenCalledTimes(1);
  });

  it("Dialog: Esc closes and focus returns to the trigger", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild><button type="button">Open</button></DialogTrigger>
        <DialogContent><DialogTitle>Hello</DialogTitle></DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("InfiniteSentinel loads once when visible and never when there is no next page", () => {
    // Faithful to the real API: a disconnected observer never calls back.
    let live: { cb: IntersectionObserverCallback; on: boolean } | null = null;
    const cb: IntersectionObserverCallback = (entries, obs) => { if (live?.on) live.cb(entries, obs); };
    globalThis.IntersectionObserver = class {
      private self: { cb: IntersectionObserverCallback; on: boolean };
      constructor(c: IntersectionObserverCallback) { this.self = { cb: c, on: true }; live = this.self; }
      observe() {} disconnect() { this.self.on = false; } unobserve() {} takeRecords() { return []; }
      root = null; rootMargin = ""; thresholds = [];
    } as unknown as typeof IntersectionObserver;
    const onLoadMore = vi.fn();
    const { rerender } = render(<InfiniteSentinel hasMore loading={false} onLoadMore={onLoadMore} />);
    act(() => cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    onLoadMore.mockClear();
    rerender(<InfiniteSentinel hasMore={false} loading={false} onLoadMore={onLoadMore} />);
    act(() => cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(onLoadMore).not.toHaveBeenCalled();
  });
});
