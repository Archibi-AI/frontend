import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { server } from "@/test/msw/server";
import { router } from "@/test/navigation-mock";
import { renderWithProviders, setupComponentTest } from "@/test/render";
import type { FilterResponse } from "../schemas";
import { AiSessionProvider } from "./ai-session";
import { BeforeAfterSlider } from "./before-after-slider";
import { FurnitureForm } from "./furniture-form";
import { FurnitureResults } from "./furniture-results";
import { AiError, AiServerError, OutOfCredits, ServiceNotInPlan } from "./outcome-card";
import { outcomeRoute, ResultView } from "./result-view";
import { ServiceHub } from "./service-hub";
import { StudioForm } from "./studio-form";

setupComponentTest();
afterEach(() => vi.restoreAllMocks());
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:before"); // jsdom has no object URLs
  URL.revokeObjectURL = vi.fn();
});
const ID = "11111111-1111-4111-8111-111111111111";
const credits = (over: object = {}) => http.get("/bff/ai/credits", () => HttpResponse.json({ ai_credits: 42, service_access: { restricted: false, allowed_services: [] }, ...over }));
const filters: FilterResponse = {
  title: "Interior",
  options: [
    { title: "Room Type", options: [{ title: "Living Room", image: null }, { title: "Kitchen", image: null }] },
    { title: "Design Style", options: [{ title: "Modern", image: null }] },
  ],
  optional_filters: { title: "Optional", color_palette: null, materials: [{ key: "floor", title: "Floor", param: "floorMaterialId", options: [{ id: 9, name: "Oak" }] }] },
};
const file = () => new File([new Uint8Array([1])], "room.jpg", { type: "image/jpeg" });
/** Captures the multipart FormData the page posts (reading a jsdom upload through MSW's stream hangs, so intercept fetch). */
function captureJobPost(): { form?: FormData } {
  const captured: { form?: FormData } = {};
  const real = globalThis.fetch;
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (String(input).includes("/bff/ai/jobs") && init?.method === "POST") {
      captured.form = init.body as FormData;
      return Response.json({ projectUuid: ID }, { status: 202 });
    }
    return real(input, init);
  });
  return captured;
}
const fields = (form: FormData | undefined): Record<string, string> =>
  Object.fromEntries([...(form?.entries() ?? [])].map(([k, v]) => [k, typeof v === "string" ? v : `<file ${v.name}>`]));
const upload = () => userEvent.upload(screen.getByLabelText("Upload a photo"), file());
const studio = (kind: "Interior" | "sketch" = "Interior") => renderWithProviders(<AiSessionProvider><StudioForm kind={kind} title="Interior Design" subtitle="s" tip="tip" /></AiSessionProvider>);

describe("ServiceHub (AH1–AH3)", () => {
  it("AH2/AH1: credits text, and a restricted plan locks cards with a link carrying the service key", async () => {
    server.use(credits({ service_access: { restricted: true, plan_name: "Starter", allowed_services: ["interior_design"] } }), http.get("/bff/ai/jobs", () => HttpResponse.json([])));
    renderWithProviders(<ServiceHub />);
    expect(await screen.findByText("42 renders left")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Exterior Design/ })).toHaveAttribute("href", "/ai/service-not-in-plan?service=exterior_design");
    expect(screen.getByRole("link", { name: /Interior Design/ })).toHaveAttribute("href", "/ai/interior");
    expect(screen.getAllByText("Not in your plan")).toHaveLength(4);
  });
  it("AH3: running jobs are listed and link to their result", async () => {
    server.use(credits(), http.get("/bff/ai/jobs", () => HttpResponse.json([{ projectUuid: ID, service: "sketch", state: "PROVIDER_RUNNING", createdAt: 1 }, { projectUuid: "x", service: "interior", state: "DONE", createdAt: 2 }])));
    renderWithProviders(<ServiceHub />);
    const link = await screen.findByRole("link", { name: /Sketch to Render — still designing/ });
    expect(link).toHaveAttribute("href", `/ai/result/${ID}`);
    expect(screen.queryByRole("link", { name: /Interior Design — still designing/ })).not.toBeInTheDocument();
  });
});

describe("StudioForm (IN1, IN4–IN6, SKF2)", () => {
  it("IN5: Generate is disabled until an image is chosen", async () => {
    server.use(credits(), http.get("/bff/ai/filters", () => HttpResponse.json(filters)));
    studio();
    expect(await screen.findByText("Living Room")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    await upload();
    expect(screen.getByRole("button", { name: "Generate" })).toBeEnabled();
  });

  it("IN1: switching mode refetches filters with section=creative", async () => {
    const sections: string[] = [];
    server.use(credits(), http.get("/bff/ai/filters", ({ request }) => { sections.push(new URL(request.url).searchParams.get("section")!); return HttpResponse.json(filters); }));
    studio();
    await screen.findByText("Living Room");
    await userEvent.click(screen.getByRole("radio", { name: /Creative/ }));
    await waitFor(() => expect(sections).toEqual(["beautiful", "creative"]));
  });

  it("submits the picks to /bff/ai/jobs and opens the result page", async () => {
    server.use(credits(), http.get("/bff/ai/filters", () => HttpResponse.json(filters)));
    const posted = captureJobPost();
    studio();
    await userEvent.click(await screen.findByRole("button", { name: "Living Room" }));
    await userEvent.click(screen.getByRole("button", { name: "Modern" }));
    await userEvent.click(screen.getByRole("button", { name: /Optional/ }));
    await userEvent.click(screen.getByRole("button", { name: "Oak" }));
    await userEvent.type(screen.getByLabelText("Describe it (optional)"), "bright");
    await upload();
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(`/ai/result/${ID}`));
    expect(fields(posted.form)).toMatchObject({
      service: "interior", mode: "beautiful", roomType: "Living Room", designStyle: "Modern", prompt: "bright", floorMaterialId: "9", beforeImage: "<file room.jpg>",
    });
    expect(JSON.parse(fields(posted.form).filterSummary!)).toEqual([
      { title: "Room Type", value: "Living Room" }, { title: "Design Style", value: "Modern" }, { title: "Floor", value: "Oak" }, { title: "Prompt", value: "bright" },
    ]);
  });

  it("IN4: a restricted plan blocks before upload (no /bff/ai/jobs call)", async () => {
    const jobs = vi.fn();
    server.use(credits({ service_access: { restricted: true, allowed_services: ["exterior_design"] } }), http.get("/bff/ai/filters", () => HttpResponse.json(filters)),
      http.post("/bff/ai/jobs", () => { jobs(); return HttpResponse.json({}); }));
    studio();
    await screen.findByText("Living Room");
    await waitFor(() => expect(screen.getByText("42 renders left")).toBeInTheDocument());
    await upload();
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(router.push).toHaveBeenCalledWith("/ai/service-not-in-plan?service=interior_design");
    expect(jobs).not.toHaveBeenCalled();
  });

  it.each([
    ["OUT_OF_CREDIT", 400, "/ai/out-of-credits"],
    ["SERVICE_NOT_IN_PLAN", 400, "/ai/service-not-in-plan?service=interior_design"],
    ["SERVER", 500, "/ai/server-error"],
  ])("IN6: start error %s navigates to %s", async (code, status, to) => {
    server.use(credits(), http.get("/bff/ai/filters", () => HttpResponse.json(filters)), http.post("/bff/ai/jobs", () => HttpResponse.json({ error: { code, message: "m" } }, { status })));
    studio();
    await screen.findByText("Living Room");
    await upload();
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(to));
  });

  it("an upload/validation message is shown inline", async () => {
    server.use(credits(), http.get("/bff/ai/filters", () => HttpResponse.json(filters)), http.post("/bff/ai/jobs", () => HttpResponse.json({ error: { code: "UNKNOWN", message: "Image is too small." } }, { status: 400 })));
    studio();
    await screen.findByText("Living Room");
    await upload();
    await userEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Image is too small.");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("SKF2: sketch tabs map to the part and fetch section=sketch-to-render", async () => {
    const seen: string[] = [];
    server.use(credits(), http.get("/bff/ai/filters", ({ request }) => { const q = new URL(request.url).searchParams; seen.push(`${q.get("part")}/${q.get("section")}`); return HttpResponse.json(filters); }));
    studio("sketch");
    await screen.findByText("Living Room");
    await userEvent.click(screen.getByRole("tab", { name: "Landscape" }));
    await waitFor(() => expect(seen).toEqual(["Interior/sketch-to-render", "Landscape/sketch-to-render"]));
  });
});

describe("FurnitureForm", () => {
  it("posts service=furniture with only the image and opens the result", async () => {
    server.use(credits());
    const posted = captureJobPost();
    renderWithProviders(<AiSessionProvider><FurnitureForm /></AiSessionProvider>);
    expect(screen.getByRole("button", { name: "Find furniture" })).toBeDisabled();
    await upload();
    await userEvent.click(screen.getByRole("button", { name: "Find furniture" }));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(`/ai/result/${ID}`));
    expect(Object.keys(fields(posted.form))).toEqual(["service", "beforeImage"]);
  });
});

describe("BeforeAfterSlider (RS3)", () => {
  it("keyboard ←/→ moves the handle, Home/End jump", () => {
    renderWithProviders(<BeforeAfterSlider before="b.jpg" after="a.jpg" />);
    const slider = screen.getByRole("slider", { name: "Before and after comparison" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "55");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(slider).toHaveAttribute("aria-valuenow", "45");
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider).toHaveAttribute("aria-valuenow", "100");
  });
  it("RS5: an expired (failing) after image reports an error", () => {
    const onError = vi.fn();
    renderWithProviders(<BeforeAfterSlider before="b.jpg" after="a.jpg" onAfterError={onError} />);
    fireEvent.error(screen.getByAltText("After: the AI design"));
    expect(onError).toHaveBeenCalled();
  });
});

describe("FurnitureResults (FFF2, FFF3, RS6)", () => {
  const item = (position: number, title: string) => ({ position, title, link: `https://shop.test/${position}`, source: "IKEA", price: { value: "$499" }, in_stock: true, thumbnail: "t.jpg", image: "i.jpg", rating: 4.5, reviews: 120 });
  it("RS6/FFF3: groups per category; product links are new-tab, nofollow sponsored", async () => {
    renderWithProviders(<FurnitureResults result={{ success: true, result: { Sofa: [item(1, "Kivik sofa")], Lamp: [item(2, "Floor lamp")] }, currency: "CAD", currencyCymbol: "$" }} />);
    const link = screen.getByRole("link", { name: /Kivik sofa/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener nofollow sponsored");
    expect(screen.getByText("$499")).toBeInTheDocument();
    expect(screen.queryByText("Floor lamp")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Lamp/ }));
    expect(screen.getByRole("link", { name: /Floor lamp/ })).toBeInTheDocument();
  });
  it("FFF2: an empty result shows the retry message", () => {
    renderWithProviders(<FurnitureResults result={{ success: true, result: {} }} />);
    expect(screen.getByText("We couldn't find matching products. Try a clearer photo.")).toBeInTheDocument();
  });
});

describe("ResultView (RS1, RS2, RS4)", () => {
  const filtersSummary = [{ title: "Design Style", value: "Modern" }];
  const result = { output: "https://signed/out.png", leftCredits: 4, message: "successful", professionals: [{ uuid: "p1", fullname: "Alice", profession: "Designer", isWishedList: false }] };
  const view = () => renderWithProviders(<AiSessionProvider><ResultView projectUuid={ID} /></AiSessionProvider>);

  it("running shows progress and the user's picks, then renders the finished design with a download link and pros", async () => {
    let calls = 0;
    server.use(credits(), http.get(`/bff/ai/jobs/${ID}`, () => ++calls === 1
      ? HttpResponse.json({ state: "running", startedAt: 1, service: "interior", filters: filtersSummary })
      : HttpResponse.json({ state: "done", service: "interior", filters: filtersSummary, result })));
    view();
    expect(await screen.findByText("Designing your space…")).toBeInTheDocument();
    expect(screen.getByText("Modern")).toBeInTheDocument();
    expect(await screen.findByAltText("Your AI design", {}, { timeout: 6000 })).toHaveAttribute("src", "https://signed/out.png");
    expect(screen.getByRole("link", { name: /Download/ })).toHaveAttribute("href", `/bff/ai/jobs/${ID}/download`); // RS4
    expect(screen.getByRole("link", { name: "Generate another" })).toHaveAttribute("href", "/ai/interior");
    expect(screen.getByRole("link", { name: /Alice/ })).toBeInTheDocument();
    const polls = calls;
    await new Promise((r) => setTimeout(r, 3000));
    expect(calls).toBe(polls); // RS1: polling stops on done
  }, 15000);

  it("Share opens the shared sheet with X, Facebook, LinkedIn, Pinterest, Telegram, Download and Copy link", async () => {
    server.use(credits(), http.get(`/bff/ai/jobs/${ID}`, () => HttpResponse.json({ state: "done", service: "interior", filters: [], result })));
    view();
    await userEvent.click(await screen.findByRole("button", { name: /Share/ }, { timeout: 6000 }));
    const dialog = await screen.findByRole("dialog");
    for (const name of ["X", "Facebook", "LinkedIn", "Pinterest", "Telegram"]) expect(within(dialog).getByRole("link", { name })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Download/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Copy link/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Pinterest" }).getAttribute("href")).toContain(encodeURIComponent(result.output));
  }, 15000);

  it("RS2: a failed job replaces the page with the matching outcome route", async () => {
    server.use(http.get(`/bff/ai/jobs/${ID}`, () => HttpResponse.json({ state: "failed", service: "exterior", filters: [], error: { code: "UNKNOWN", message: "x" } })));
    view();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/ai/error"));
    expect(outcomeRoute("SERVER", "interior_design")).toBe("/ai/server-error");
    expect(outcomeRoute("OUT_OF_CREDIT", "interior_design")).toBe("/ai/out-of-credits");
    expect(outcomeRoute("SERVICE_NOT_IN_PLAN", "exterior_design")).toBe("/ai/service-not-in-plan?service=exterior_design");
  });

  it("an unknown job id shows an error without a retry loop", async () => {
    server.use(http.get(`/bff/ai/jobs/${ID}`, () => HttpResponse.json({ error: { code: "NOT_FOUND", message: "nope" } }, { status: 404 })));
    view();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("furniture jobs render product groups", async () => {
    server.use(credits(), http.get(`/bff/ai/jobs/${ID}`, () => HttpResponse.json({ state: "done", service: "furniture", filters: [], result: { leftCredits: 3, output: { success: true, result: { Sofa: [{ position: 1, title: "Kivik sofa", link: "https://shop.test/1", source: "IKEA", price: { value: "$499" }, in_stock: true, thumbnail: "t", image: "i" }] } } } })));
    view();
    expect(await screen.findByRole("link", { name: /Kivik sofa/ })).toBeInTheDocument();
  });
});

describe("outcome screens (OC1–OC3)", () => {
  it("OC2: out of credits shows the balance and the two billing links, no one-pack offer", async () => {
    server.use(credits({ ai_credits: 0 }));
    renderWithProviders(<OutOfCredits />);
    expect(await screen.findByText("You have 0 renders left.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get more renders" })).toHaveAttribute("href", "/billing?section=credits");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/billing?section=subscriptions");
    expect(screen.queryByText(/pack/i)).not.toBeInTheDocument();
  });
  it("OC1: names the service and the plan", async () => {
    server.use(credits({ service_access: { restricted: true, plan_name: "Starter", allowed_services: [] } }));
    renderWithProviders(<ServiceNotInPlan service="exterior_design" />);
    expect(await screen.findByText("Exterior Design isn't included in your Starter plan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/billing?section=subscriptions");
    expect(screen.getByRole("link", { name: "Back to AI Studio" })).toHaveAttribute("href", "/ai");
  });
  it("OC3: an unknown or missing service falls back to generic text", async () => {
    server.use(credits());
    const { unmount } = renderWithProviders(<ServiceNotInPlan service="mystery" />);
    expect(await screen.findByText("This service isn't included in your current plan.")).toBeInTheDocument();
    unmount();
    renderWithProviders(<ServiceNotInPlan />);
    expect(await screen.findByText("This service isn't included in your current plan.")).toBeInTheDocument();
  });
  it("error screens offer Try again / AI Studio", async () => {
    renderWithProviders(<AiError />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(router.back).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "AI Studio" })).toHaveAttribute("href", "/ai");
    renderWithProviders(<AiServerError />);
    expect(screen.getAllByRole("button", { name: "Try again" })).toHaveLength(2);
  });
});
