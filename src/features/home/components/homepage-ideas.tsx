"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PostModal } from "@/features/ideabank";
import { routes } from "@/shared/config/routes";
import type { AppError } from "@/shared/errors/app-error";
import { bffFetch } from "@/shared/http/bff-fetch";
import { cn } from "@/shared/lib/cn";
import { RemoteImage } from "@/shared/ui/remote-image";
import { Skeleton } from "@/shared/ui/skeleton";
import type { HomepageIdea, HomepageIdeas as Data } from "../schemas";
import { ROW, ROW_ITEM_MD, SectionDivider, SectionTitle } from "./section-title";

const CARD = cn("w-[160px] shrink-0 rounded-xl", ROW_ITEM_MD);

/** HomepageIdeasSection.kt: the owner's Idea Bank picks (0..10, admin order). Hidden when empty or failed. */
export function HomepageIdeas() {
  const query = useQuery<Data, AppError>({ queryKey: ["me", "homepage-ideas"], queryFn: () => bffFetch<Data>("/bff/home/ideas"), staleTime: 5 * 60_000, retry: false });
  const [opened, setOpened] = useState<number>();
  const ideas = query.data?.ideas;

  if (!query.isPending && !ideas?.length) return null;
  return (
    <section aria-label="Ideas for your next project">
      <SectionDivider />
      <SectionTitle title="Ideas for your next project" actionLabel="See all" actionHref={routes.ideabank.index()} />
      {ideas ? (
        <ul className={ROW}>
          {ideas.map((idea) => <IdeaCard key={idea.uuid} idea={idea} onOpen={() => setOpened(idea.uuid)} />)}
        </ul>
      ) : (
        <div className={ROW} role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => <Skeleton key={i} className={cn(CARD, "aspect-[4/3]")} />)}
        </div>
      )}
      {opened !== undefined && <PostModal uuid={opened} onClose={() => setOpened(undefined)} />}
    </section>
  );
}

/** Thumbnail first; the title row exists only when the idea has a title. */
function IdeaCard({ idea, onOpen }: { idea: HomepageIdea; onOpen: () => void }) {
  const title = idea.title?.trim();
  return (
    <li className={cn(CARD, "overflow-hidden border border-line bg-surface")}>
      <button type="button" onClick={onOpen} aria-label={title || "Open idea"} className="block w-full text-left">
        <RemoteImage src={idea.thumbnail || idea.image} alt={title || "Idea"} className="aspect-[4/3] w-full bg-track object-cover" />
        {title && <span className="block truncate px-3 py-2.5 text-sm font-semibold text-ink-2">{title}</span>}
      </button>
    </li>
  );
}
