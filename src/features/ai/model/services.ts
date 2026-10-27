import type { Service } from "../schemas";

export const AI_SERVICES = [
  { id: "interior", key: "interior_design", title: "Interior Design", href: "/ai/interior", blurb: "Restyle any room from a photo." },
  { id: "exterior", key: "exterior_design", title: "Exterior Design", href: "/ai/exterior", blurb: "Reimagine your facade." },
  { id: "landscape", key: "landscape_design", title: "Landscape Design", href: "/ai/landscape", blurb: "Design your garden and yard." },
  { id: "sketch", key: "sketch_to_render", title: "Sketch to Render", href: "/ai/sketch-to-render", blurb: "Turn sketches into photoreal renders." },
  { id: "furniture", key: "furniture_finder", title: "Furniture Finder", href: "/ai/furniture-finder", blurb: "Find and shop the furniture in a photo." },
] as const satisfies ReadonlyArray<{ id: Service; key: string; title: string; href: string; blurb: string }>;

/** ServiceAccess.kt:24-26 */
export const serviceLabel = (key: string): string => AI_SERVICES.find((s) => s.key === key)?.title ?? key;
export const serviceById = (id: Service) => AI_SERVICES.find((s) => s.id === id)!;
export const serviceHref = (id: Service): string => serviceById(id).href;

export interface ServiceAccess { restricted?: boolean; plan_name?: string | null; allowed_services?: string[] }
/** Client gate mirroring submitButton.kt:57-59: restricted && key not allowed. */
export const isLocked = (access: ServiceAccess | null | undefined, key: string): boolean =>
  Boolean(access?.restricted) && !(access?.allowed_services ?? []).includes(key);
