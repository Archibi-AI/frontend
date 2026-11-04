import "server-only";
import { djangoFetch } from "@/server/django/client";
import type { SessionWriter } from "@/server/session/cookies";
import { HomepageIdeasSchema, RecentProjectsSchema } from "../schemas";

// Function names equal the Ktor data-source methods (UserProjectsKtorRemoteDataSource, AIGalleryKtorRemoteDataSource).

export const getRecentProjects = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "user/ai/recent-projects/", auth: "required", schema: RecentProjectsSchema, session });

export const getHomepageIdeas = (session?: SessionWriter) =>
  djangoFetch({ method: "GET", path: "ai/gallery/homepage-ideas/", auth: "required", schema: HomepageIdeasSchema, session });
