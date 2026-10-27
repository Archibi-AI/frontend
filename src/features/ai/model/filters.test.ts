import { describe, expect, it } from "vitest";
import { isLocked, serviceLabel } from "./services";
import { selectionToFields, summarize } from "./redesign";

describe("redesign model", () => {
  it("IN2: maps Building Type and the legacy Angles title", () => {
    expect(selectionToFields({ "Building Type": "House", "Design Style": "Modern" })).toEqual({ roomType: "", designStyle: "Modern", houseAngle: "House", gardenType: "" });
    expect(selectionToFields({ Angles: "Front" }).houseAngle).toBe("Front");
    expect(selectionToFields({ "Garden Type": "Backyard", "Room Type": "Kitchen" })).toMatchObject({ gardenType: "Backyard", roomType: "Kitchen" });
  });
  it("summarizes picks, optional picks and prompt for the result page", () => {
    expect(summarize({ "Design Style": "Modern", "Room Type": "" }, { Floor: "Oak" }, " bright ")).toEqual([
      { title: "Design Style", value: "Modern" }, { title: "Floor", value: "Oak" }, { title: "Prompt", value: "bright" },
    ]);
  });
  it("OC1/AH1: service labels and the plan gate", () => {
    expect(serviceLabel("furniture_finder")).toBe("Furniture Finder");
    expect(serviceLabel("mystery")).toBe("mystery");
    const access = { restricted: true, allowed_services: ["interior_design"] };
    expect(isLocked(access, "exterior_design")).toBe(true);
    expect(isLocked(access, "interior_design")).toBe(false);
    expect(isLocked({ restricted: false }, "exterior_design")).toBe(false);
    expect(isLocked(null, "exterior_design")).toBe(false);
  });
});
