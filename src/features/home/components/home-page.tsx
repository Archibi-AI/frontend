import { ServiceHub } from "@/features/ai";
import { HomepageIdeas } from "./homepage-ideas";
import { ProfessionalsCard } from "./professionals-card";
import { RecentProjects } from "./recent-projects";

/** HomePageScreen: Design Studio, recent projects, Idea Bank picks, professionals. */
export function HomePage() {
  return (
    <>
      <ServiceHub />
      <RecentProjects />
      <HomepageIdeas />
      <ProfessionalsCard />
    </>
  );
}
