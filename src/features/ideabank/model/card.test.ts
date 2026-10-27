import { describe, expect, it } from "vitest";
import { cardAspectRatio, cardImage, stableAspectRatioFromUuid } from "./card";

describe("card sizing (KMP GalleryImageSizing.kt)", () => {
  it("unknown size → stable id-derived bucket, identical on every render", () => {
    expect(stableAspectRatioFromUuid(0)).toBe(0.62);
    expect(stableAspectRatioFromUuid(1)).toBe(0.72);
    expect(stableAspectRatioFromUuid(6)).toBe(1.46);
    expect(stableAspectRatioFromUuid(7)).toBe(0.62);
    expect(stableAspectRatioFromUuid(-3)).toBe(stableAspectRatioFromUuid(3));
    expect(cardAspectRatio({ uuid: 341 })).toBe(cardAspectRatio({ uuid: 341 }));
  });
  it("real dimensions are used and clamped to 0.55–1.8", () => {
    expect(cardAspectRatio({ uuid: 1, width: 800, height: 600 })).toBeCloseTo(1.333, 3);
    expect(cardAspectRatio({ uuid: 1, width: 100, height: 1000 })).toBe(0.55);
    expect(cardAspectRatio({ uuid: 1, width: 5000, height: 100 })).toBe(1.8);
    expect(cardAspectRatio({ uuid: 1, image_width: 900, image_height: 600 })).toBe(1.5);
  });
  it("zero/missing dimensions fall back to the bucket", () => {
    expect(cardAspectRatio({ uuid: 2, width: 0, height: 600 })).toBe(stableAspectRatioFromUuid(2));
    expect(cardAspectRatio({ uuid: 2, width: 800, height: null })).toBe(stableAspectRatioFromUuid(2));
  });
  it("tiles prefer the thumbnail and fall back to the full image", () => {
    expect(cardImage({ image: "full.jpg", thumbnail: "thumb.webp" })).toBe("thumb.webp");
    expect(cardImage({ image: "full.jpg", thumbnail: null })).toBe("full.jpg");
    expect(cardImage({ image: "full.jpg", thumbnail: "" })).toBe("full.jpg");
  });
});
