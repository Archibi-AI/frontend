import type { FilterGroup, Service } from "../schemas";

export type RedesignPart = "Interior" | "Exterior" | "Landscape";
export type Mode = "beautiful" | "creative";
export const MODE_MODEL: Record<Mode, string> = { beautiful: "Beautiful Redesign", creative: "Creative Redesign" };
/** buildSubmitMultipart maps the page route (data/network/helper.kt:20-26). */
export const PART_DESIGN_TYPE: Record<RedesignPart, string> = { Interior: "Interior", Exterior: "Exterior", Landscape: "Garden" };
export const PART_SERVICE: Record<RedesignPart, Service> = { Interior: "interior", Exterior: "exterior", Landscape: "landscape" };
export const PART_SERVICE_KEY: Record<RedesignPart, string> = { Interior: "interior_design", Exterior: "exterior_design", Landscape: "landscape_design" };
export const BUILDING_TYPE_TITLES = ["Building Type", "Angles"] as const; // FilterOption.kt:27-33

export interface RedesignFields { roomType: string; designStyle: string; houseAngle: string; gardenType: string }

/** Picked option per filter group title -> the app's request fields (submitButton.kt:73-81). */
export function selectionToFields(sel: Record<string, string>): RedesignFields {
  return {
    roomType: sel["Room Type"] ?? "",
    designStyle: sel["Design Style"] ?? "",
    houseAngle: sel["Building Type"] ?? sel["Angles"] ?? "",
    gardenType: sel["Garden Type"] ?? "",
  };
}

/** The `filterList` the result page shows (the app's route argument). */
export function summarize(sel: Record<string, string>, optional: Record<string, string>, prompt: string) {
  const rows = Object.entries(sel).filter(([, v]) => v).map(([title, value]) => ({ title, value }));
  for (const [title, value] of Object.entries(optional)) if (value) rows.push({ title, value });
  if (prompt.trim()) rows.push({ title: "Prompt", value: prompt.trim() });
  return rows;
}

export const groupSections = (g: FilterGroup) => (g.sections && g.sections.length > 0 ? g.sections : null);
export const MAX_PROMPT = 500;
