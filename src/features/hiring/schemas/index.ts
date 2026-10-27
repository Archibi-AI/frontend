import { z } from "zod";

/** frontend/hiring/README.md — ProfessionalSimpleViewDC (HiringProfessionalCriticalInfoSerializer). */
export const ProfessionalSimpleSchema = z.object({
  uuid: z.string(),
  image: z.string().nullish(),
  fullname: z.string().nullish(),
  location: z.string().nullish(),
  profession: z.string().nullish(),
  about: z.string().nullish(),
  isWishedList: z.boolean().default(false),
});
export type ProfessionalSimple = z.infer<typeof ProfessionalSimpleSchema>;
export const ProfessionalsPageSchema = z.object({ professionals: z.array(ProfessionalSimpleSchema) });

/** GET hiring/main-menu/header/ */
export const HeaderSchema = z.object({ imageHeader: z.string(), titleHeader: z.string(), tags: z.array(z.string()) });
export type HiringHeader = z.infer<typeof HeaderSchema>;

/** GET hiring/main-menu/categories/ */
export const CategorySchema = z.object({ uuid: z.string(), title: z.string(), image: z.string().nullish() });
export const CategoriesSchema = z.array(CategorySchema);
export type HiringCategory = z.infer<typeof CategorySchema>;

/** GET hiring/pro/page/ */
export const ProjectBriefSchema = z.object({ uuid: z.number().int(), image: z.string(), title: z.string(), location: z.string() });
export const ProPageSchema = z.object({
  banner: z.string(),
  accessibility: z.number().int().nullish(),
  tags: z.array(z.string()),
  description: z.string().nullish(),
  contacts: z.object({ email: z.string().nullish(), phone: z.string().nullish(), website: z.string().nullish() }),
  projects: z.array(ProjectBriefSchema).nullish(),
});
export type ProPage = z.infer<typeof ProPageSchema>;

/** GET hiring/pro/projects/ */
export const ProProjectsSchema = z.object({
  projects: z.array(ProjectBriefSchema.extend({ googlePlay: z.string().optional(), description: z.string().optional() })),
});
export type ProProject = z.infer<typeof ProProjectsSchema>["projects"][number];

/** POST user/hiring/wishlist-check/ */
export const WishlistToggleSchema = z.object({ message: z.string() });

/** GET user/filters/ */
export const FilterTypeSchema = z.enum(["Optional", "Star", "Range", "Check"]);
export const FilterDefSchema = z.object({ title: z.string(), options: z.array(z.string()), type: FilterTypeSchema.catch("Optional") });
export const FiltersResponseSchema = z.object({ filters: z.array(FilterDefSchema) });
export type FilterDef = z.infer<typeof FilterDefSchema>;
