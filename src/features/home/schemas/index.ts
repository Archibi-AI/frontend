import { z } from "zod";

/** GET user/ai/recent-projects/ — KMP RecentProjectDC. `uuid` is unique only within its `type`. */
export const RecentProjectSchema = z.object({ uuid: z.number().int(), type: z.string(), generatedImage: z.string() });
export const RecentProjectsSchema = z.object({ projects: z.array(RecentProjectSchema) });
export type RecentProject = z.infer<typeof RecentProjectSchema>;
export type RecentProjects = z.infer<typeof RecentProjectsSchema>;

/** GET ai/gallery/homepage-ideas/ — KMP HomepageIdeaDC. `uuid` is the Idea Bank post id. */
export const HomepageIdeaSchema = z.object({ uuid: z.number().int(), title: z.string().nullish(), image: z.string(), thumbnail: z.string().nullish() });
export const HomepageIdeasSchema = z.object({ ideas: z.array(HomepageIdeaSchema) });
export type HomepageIdea = z.infer<typeof HomepageIdeaSchema>;
export type HomepageIdeas = z.infer<typeof HomepageIdeasSchema>;
