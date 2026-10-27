import { describe, expect, it } from "vitest";
import { feedUrl, isPostId, parseGalleryType, parseTagIds, toggleTag } from "./gallery";

describe("gallery model", () => {
  it("parseGalleryType defaults to interior like the app", () => {
    expect(parseGalleryType("EXTERIOR")).toBe("exterior");
    expect(parseGalleryType("landscape")).toBe("landscape");
    expect(parseGalleryType("kitchen")).toBe("interior");
    expect(parseGalleryType(undefined)).toBe("interior");
  });
  it("parseTagIds keeps numeric unique ids only", () => {
    expect(parseTagIds("12, 15,12,abc,,7;DROP")).toEqual(["12", "15"]);
    expect(parseTagIds(null)).toEqual([]);
  });
  it("toggleTag adds and removes", () => {
    expect(toggleTag(["1"], "2")).toEqual(["1", "2"]);
    expect(toggleTag(["1", "2"], "1")).toEqual(["2"]);
  });
  it("feedUrl is the shareable state", () => {
    expect(feedUrl("exterior", ["12", "15"])).toBe("/ideabank?type=exterior&tags=12%2C15");
    expect(feedUrl("interior", [])).toBe("/ideabank?type=interior");
  });
  it("isPostId", () => {
    expect(isPostId("341")).toBe(true);
    expect(isPostId("34a")).toBe(false);
    expect(isPostId("")).toBe(false);
  });
});
