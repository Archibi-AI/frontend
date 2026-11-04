import type { Service } from "../schemas";

/** The app's Home → Design Studio section (strings.xml home_*; banners from /images/homepage/*). */
export const HOME_HEADING = { before: "Let’s design your", highlight: "dream space", subtitle: "Snap a photo, choose a style, see the magic." } as const;
export const HOME_STUDIO_TITLE = "Design Studio";

export const HOME_TOOLS: ReadonlyArray<{ id: Service; title: string; subtitle: string; image: string }> = [
  { id: "interior", title: "Interior", subtitle: "Reimagine a room", image: "/web-static/brand/home/interior.jpg" },
  { id: "exterior", title: "Exterior", subtitle: "Transform your façade", image: "/web-static/brand/home/exterior.jpg" },
  { id: "landscape", title: "Landscape", subtitle: "Redesign your outdoors", image: "/web-static/brand/home/landscape.jpg" },
  { id: "sketch", title: "Sketch to render", subtitle: "Bring your sketch to life", image: "/web-static/brand/home/sketch.jpg" },
];
export const HOME_FURNITURE = { id: "furniture" as Service, title: "Find furniture", subtitle: "Love a piece? We’ll help you buy it", image: "/web-static/brand/home/furniture.jpg" };
