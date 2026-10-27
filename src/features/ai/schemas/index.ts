import { z } from "zod";
import { ProfessionalSimpleSchema } from "@/features/hiring/schemas";

export { CreditsSchema, type Credits } from "@/features/account/schemas";

/** X2/X3/X5 response — frontend/ai/api/creative-redesign-process.md. SECRET: never leaves the BFF runner. */
export const DynamicConfigSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  body: z.record(z.string(), z.unknown()),
  project_uuid: z.string(),
});
export type DynamicConfig = z.infer<typeof DynamicConfigSchema>;

/** X4/X6 response — frontend/ai/api/redesign-save.md */
export const SubmitResponseSchema = z.object({
  output: z.string().default(""),
  leftCredits: z.number().int().default(0),
  message: z.string().default(""),
  professionals: z.array(ProfessionalSimpleSchema).default([]),
});
export type SubmitResponse = z.infer<typeof SubmitResponseSchema>;

/** X7 response — frontend/ai/api/furniture-finder-submit.md (`currencyCymbol` is the backend's spelling) */
const Price = z.object({ value: z.string() });
export const ProductItemSchema = z.object({
  position: z.number().int(),
  title: z.string(),
  link: z.string(),
  source: z.string(),
  source_icon: z.string().nullish(),
  price: Price,
  in_stock: z.boolean().default(false),
  thumbnail: z.string(),
  thumbnail_width: z.number().int().nullish(),
  thumbnail_height: z.number().int().nullish(),
  image: z.string(),
  image_width: z.number().int().nullish(),
  image_height: z.number().int().nullish(),
  rating: z.number().nullish(),
  reviews: z.number().int().nullish(),
  condition: z.string().nullish(),
});
export type ProductItem = z.infer<typeof ProductItemSchema>;
export const AISubmitResponseSchema = z.object({
  output: z.object({
    success: z.boolean(),
    result: z.record(z.string(), z.array(ProductItemSchema)),
    currencyCymbol: z.string().nullish(),
    currency: z.string().nullish(),
  }),
  leftCredits: z.number().int(),
});
export type FurnitureResponse = z.infer<typeof AISubmitResponseSchema>;

/** X1 response — frontend/ai/api/design-filters.md */
const Option = z.object({ title: z.string(), image: z.string().nullable().optional() });
const FilterSection = z.object({ title: z.string().nullable().optional(), options: z.array(Option) });
const FilterOption = z.object({ title: z.string(), options: z.array(Option), sections: z.array(FilterSection).nullable().optional() });
const OptionalFilters = z.object({
  title: z.string().default("Optional"),
  color_palette: z
    .object({ title: z.string(), param: z.string(), options: z.array(z.object({ id: z.number().int(), name: z.string(), colors: z.array(z.string()) })) })
    .nullable()
    .optional(),
  materials: z.array(z.object({ key: z.string(), title: z.string(), param: z.string(), options: z.array(z.object({ id: z.number().int(), name: z.string() })) })).default([]),
});
export const FilterResponseSchema = z.object({ title: z.string(), options: z.array(FilterOption), optional_filters: OptionalFilters.nullable().optional() });
export type FilterResponse = z.infer<typeof FilterResponseSchema>;
export type FilterGroup = z.infer<typeof FilterOption>;
export type OptionalFiltersData = z.infer<typeof OptionalFilters>;

/** BFF job views (api/bff-ai-jobs.md) */
export const SERVICES = ["interior", "exterior", "landscape", "sketch", "furniture"] as const;
export type Service = (typeof SERVICES)[number];
export const OPTIONAL_PARAMS = ["colorPaletteId", "ceilingMaterialId", "wallMaterialId", "floorMaterialId", "facadeMaterialId", "pathMaterialId"] as const;
export const FilterSummarySchema = z.array(z.object({ title: z.string(), value: z.string() }));
export type FilterSummary = z.infer<typeof FilterSummarySchema>;

export const JobErrorSchema = z.object({ code: z.string(), message: z.string() });
export const JobViewSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("running"), startedAt: z.number(), service: z.enum(SERVICES), filters: FilterSummarySchema }),
  z.object({ state: z.literal("saving"), service: z.enum(SERVICES), filters: FilterSummarySchema }),
  z.object({ state: z.literal("done"), service: z.enum(SERVICES), filters: FilterSummarySchema, result: z.union([SubmitResponseSchema, AISubmitResponseSchema]) }),
  z.object({ state: z.literal("failed"), service: z.enum(SERVICES), filters: FilterSummarySchema, error: JobErrorSchema }),
]);
export type JobView = z.infer<typeof JobViewSchema>;
export const RecentJobSchema = z.object({ projectUuid: z.string(), service: z.enum(SERVICES), state: z.string(), createdAt: z.number() });
export type RecentJob = z.infer<typeof RecentJobSchema>;
