import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "./bottom-nav";
import { UserMenu } from "./user-menu";

vi.mock("next/link", () => ({
  default: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) => (
    <a href={href} onClick={(e) => { onClick?.(e); e.preventDefault(); }} {...rest}>{children}</a>
  ),
}));

describe("app shell (F03)", () => {
  it("bottom nav marks the active tab and ignores re-clicks", async () => {
    render(<BottomNav pathname="/hiring/tag/Modern" />);
    const pros = screen.getByRole("link", { name: /Pros/ });
    expect(pros).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Ideas/ })).not.toHaveAttribute("aria-current");
    await userEvent.click(pros); // no throw, default prevented
  });

  it("the app's tabs, with Home active only on /", () => {
    const { unmount } = render(<BottomNav pathname="/" />);
    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["Home", "Projects", "AI", "Ideas", "Pros"]);
    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("aria-current", "page");
    unmount();
    render(<BottomNav pathname="/account/projects" />);
    expect(screen.getByRole("link", { name: /Projects/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Home/ })).not.toHaveAttribute("aria-current");
  });

  it("signed-out shows Sign in linking to login with next", () => {
    render(<UserMenu status="anonymous" user={null} signInHref="/auth/login?next=%2Fhiring" />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth/login?next=%2Fhiring");
  });

  it("signed-in shows the avatar menu", () => {
    render(<UserMenu status="authenticated" user={{ username: "Abtin", email: "a@b.c", imageUri: "" }} signInHref="/x" />);
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
  });
});
