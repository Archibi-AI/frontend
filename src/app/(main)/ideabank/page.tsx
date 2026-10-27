import type { Metadata } from "next";
import { GalleryGrid, GalleryTabs, parseGalleryType, parseTagIds, TagChips } from "@/features/ideabank";
import { rememberItems } from "@/features/ideabank/server/item-cache";
import { getMainMenuPosts, getMainMenuTags, getTagPosts } from "@/features/ideabank/server/repository";
import type { GalleryPostSimple, GalleryTag } from "@/features/ideabank/schemas";
import { AppError } from "@/shared/errors/app-error";
import { Container } from "@/shared/layout/container";
import { PageHeading } from "@/shared/layout/page-heading";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const LABEL = { interior: "Interior", exterior: "Exterior", landscape: "Landscape" } as const;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const type = parseGalleryType(first((await searchParams).type));
  return {
    title: `${LABEL[type]} design ideas`,
    description: `Browse real ${type} design ideas in the Archibi Idea Bank, then redesign your own space with AI.`,
    alternates: { canonical: `/ideabank?type=${type}` },
  };
}

/** Mirrors AIGalleryMainMenu (mainmenu/screen.kt): tabs, tag chips (I1) and the infinite masonry (I2 / I3). Page 1 is server-rendered. */
export default async function IdeaBankPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const type = parseGalleryType(first(sp.type));
  const selected = parseTagIds(first(sp.tags));

  const [tags, posts] = await Promise.all([
    getMainMenuTags(type).catch((): GalleryTag[] => []), // chips are optional; the feed still works without them
    (selected.length ? getTagPosts(selected.join(","), 1) : getMainMenuPosts(type, 1)).then((r) => r.posts).catch((e): GalleryPostSimple[] => {
      if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
      throw e;
    }),
  ]);
  await rememberItems(posts);

  return (
    <Container className="py-8 md:py-12">
      <PageHeading eyebrow="Idea Bank" title="Find your next idea" subtitle="Real interiors, exteriors and landscapes to inspire your next design." />
      <GalleryTabs type={type} />
      <TagChips type={type} tags={tags} selected={selected} />
      <GalleryGrid type={type} tags={selected} initial={posts} />
    </Container>
  );
}
