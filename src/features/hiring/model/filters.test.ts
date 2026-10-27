import { describe, expect, it } from "vitest";
import type { FilterDef } from "../schemas";
import { decodeSelection, encodeSelection, selectionCount, toApiFilters } from "./filters";

const defs: FilterDef[] = [
  { title: "tags", options: ["Modern", "Classic"], type: "Optional" },
  { title: "price", options: ["0", "90"], type: "Range" },
];

describe("hiring filters", () => {
  it("sends the app's exact shape: only selected filters, {name,isSelected:true}, type kept", () => {
    expect(JSON.parse(toApiFilters(defs, { tags: ["Classic"] }))).toEqual([
      { title: "tags", options: [{ name: "Classic", isSelected: true }], type: "Optional" },
    ]);
  });
  it("no selection → []", () => {
    expect(toApiFilters(defs, {})).toBe("[]");
    expect(toApiFilters(defs, { tags: [] })).toBe("[]");
  });
  it("round-trips the shareable selection and drops empty groups", () => {
    const sel = { tags: ["Modern", "Classic"], price: [] };
    const decoded = decodeSelection(encodeSelection(sel));
    expect(decoded).toEqual({ tags: ["Modern", "Classic"] });
    expect(selectionCount(decoded)).toBe(2);
    expect(encodeSelection({})).toBe("");
  });
  it("ignores garbage in ?filters=", () => {
    for (const bad of ["", "%%%", Buffer.from("[1,2]").toString("base64url"), Buffer.from('{"tags":[1]}').toString("base64url")]) {
      expect(decodeSelection(bad)).toEqual({});
    }
  });
});
