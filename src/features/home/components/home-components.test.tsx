import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/msw/server";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import { HomepageIdeas } from "./homepage-ideas";
import { ProfessionalsCard } from "./professionals-card";
import { RecentProjects } from "./recent-projects";

setupComponentTest();
const recent = (body: object, status = 200) => server.use(http.get("*/bff/home/recent-projects", () => HttpResponse.json(body, { status })));
const ideas = (body: object, status = 200) => server.use(http.get("*/bff/home/ideas", () => HttpResponse.json(body, { status })));
const failure = { error: { code: "SERVER", message: "x" } };

describe("RecentProjects (RecentProjectsSection.kt)", () => {
  it("shows the images and links View all to My Projects", async () => {
    // the same uuid in two tables must still render two cards
    recent({ projects: [{ uuid: 1, type: "creative_redesign", generatedImage: "https://s/a.png" }, { uuid: 1, type: "sketch_to_render", generatedImage: "https://s/b.png" }] });
    renderWithProviders(<RecentProjects />);
    expect(await screen.findAllByRole("button", { name: "Open recent project" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Your recent projects" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute("href", "/account/projects");
  });
  it("tapping an image opens it full size", async () => {
    recent({ projects: [{ uuid: 1, type: "creative_redesign", generatedImage: "https://s/a.png" }] });
    renderWithProviders(<RecentProjects />);
    await userEvent.click(await screen.findByRole("button", { name: "Open recent project" }));
    expect(within(await screen.findByRole("dialog")).getByRole("img")).toHaveAttribute("src", "https://s/a.png");
  });
  it("empty copy", async () => {
    recent({ projects: [] });
    renderWithProviders(<RecentProjects />);
    expect(await screen.findByText("No Project Created Yet")).toBeInTheDocument();
  });
  it("error offers a retry that works", async () => {
    recent(failure, 500);
    renderWithProviders(<RecentProjects />);
    const retry = await screen.findByRole("button", { name: /Tap to retry/ });
    expect(retry).toHaveTextContent("Couldn't load this section.");
    recent({ projects: [] });
    await userEvent.click(retry);
    expect(await screen.findByText("No Project Created Yet")).toBeInTheDocument();
  });
});

describe("HomepageIdeas (HomepageIdeasSection.kt)", () => {
  const post = { uuid: 7, tags: [], isFavorite: false, likeCount: 0, item: { image: "https://s/full.jpg", width: null, height: null } };
  it("prefers the thumbnail, and draws a title row only when there is a title", async () => {
    ideas({ ideas: [{ uuid: 7, title: " Warm minimalism ", image: "https://s/7.jpg", thumbnail: "https://s/7-t.webp" }, { uuid: 8, title: null, image: "https://s/8.jpg", thumbnail: null }] });
    renderWithProviders(<HomepageIdeas />);
    expect(await screen.findByRole("img", { name: "Warm minimalism" })).toHaveAttribute("src", "https://s/7-t.webp");
    expect(screen.getByText("Warm minimalism")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Idea" })).toHaveAttribute("src", "https://s/8.jpg");
    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute("href", "/ideabank");
  });
  it("opens the post dialog in place, and closing it stays on Home", async () => {
    ideas({ ideas: [{ uuid: 7, image: "https://s/7.jpg" }] });
    server.use(http.get("*/bff/ideabank/posts/7", () => HttpResponse.json(post)));
    renderWithProviders(<HomepageIdeas />);
    await userEvent.click(await screen.findByRole("button", { name: "Open idea" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Ideas for your next project" })).toBeInTheDocument();
  });
  it.each([["empty", { ideas: [] }, 200], ["failed", failure, 500]] as const)("hidden when %s", async (_name, body, status) => {
    let hit = false;
    server.use(http.get("*/bff/home/ideas", () => { hit = true; return HttpResponse.json(body, { status }); }));
    renderWithProviders(<HomepageIdeas />);
    await waitFor(() => expect(hit).toBe(true));
    await waitFor(() => expect(screen.queryByRole("heading")).not.toBeInTheDocument());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("ProfessionalsCard (ProfessionalsSection.kt)", () => {
  it("has the app's copy and opens Pros", () => {
    renderWithProviders(<ProfessionalsCard />);
    const card = screen.getByRole("link");
    expect(card).toHaveAttribute("href", "/hiring");
    for (const text of ["Bring your design to life", "Find architects and contractors", "Explore professionals"]) expect(within(card).getByText(text)).toBeInTheDocument();
  });
});
