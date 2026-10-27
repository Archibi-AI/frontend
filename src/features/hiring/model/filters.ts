import type { FilterDef } from "../schemas";

/** title → selected option names. */
export type Selection = Record<string, string[]>;

/**
 * The exact JSON the app sends (serializeFiltersToJson, encodeDefaults=true): only filters with at least one
 * selected option, each option as {name,isSelected:true}. No selection → "[]".
 */
export function toApiFilters(defs: readonly FilterDef[], selection: Selection): string {
  const out = defs
    .filter((d) => (selection[d.title]?.length ?? 0) > 0)
    .map((d) => ({ title: d.title, options: selection[d.title]!.map((name) => ({ name, isSelected: true })), type: d.type }));
  return JSON.stringify(out);
}

export const selectionCount = (selection: Selection) => Object.values(selection).reduce((n, v) => n + v.length, 0);

/** `?filters=` carries base64url(JSON of Selection) so a filtered view can be shared. */
export function encodeSelection(selection: Selection): string {
  const clean = Object.fromEntries(Object.entries(selection).filter(([, v]) => v.length > 0));
  return Object.keys(clean).length === 0 ? "" : Buffer.from(JSON.stringify(clean)).toString("base64url");
}

export function decodeSelection(raw: string | undefined | null): Selection {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Selection = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) out[k.slice(0, 40)] = v.slice(0, 50).map((x: string) => x.slice(0, 80));
    }
    return out;
  } catch {
    return {};
  }
}
