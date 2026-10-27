/** HiringMainMenuViewModel.TYPES — tabs Designer · Constructor · Landscape; the API gets the lowercase value. */
export const HIRING_TYPES = [
  { value: "designer", label: "Designer" },
  { value: "constructor", label: "Constructor" },
  { value: "landscape", label: "Landscape" },
] as const;
export type HiringType = (typeof HIRING_TYPES)[number]["value"];

export const parseHiringType = (v: string | undefined): HiringType => HIRING_TYPES.find((t) => t.value === v?.toLowerCase())?.value ?? "designer";
export const hiringTypeLabel = (t: HiringType) => HIRING_TYPES.find((x) => x.value === t)!.label;
/** HiringCategory.pk is a BigAutoField (a number); the app calls it `uuid` but accepts whatever id Django sent. */
export const isCategoryId = (v: string) => /^\d{1,12}$/.test(v) || isUuid(v);
export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
