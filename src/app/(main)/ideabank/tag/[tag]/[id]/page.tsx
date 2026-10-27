import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalleryGrid, isPostId } from "@/features/ideabank";
import { rememberItems } from "@/features/ideabank/server/item-cache";
import { getTagPosts } from "@/features/ideabank/server/repository";
import type { GalleryPostSimple } from "@/features/ideabank/schemas";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";
import { Container } from "@/shared/layout/container";
import { PageHeading } from "@/shared/layout/page-heading";

type Params = Promise<{ tag: string; id: string }>;
const decode = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tag, id } = await params;
  const name = decode(tag);
  return { title: `${name} design ideas`, description: `Design ideas tagged ${name} in the Archibi Idea Bank.`, alternates: { canonical: routes.ideabank.tag(name, id) } };
}

/** Mirrors the app's tag screen (ai_gallery/tags/{tag}/{id}): every post with this tag. */
export default async function TagPage({ params }: { params: Params }) {
  const { tag, id } = await params;
  if (!isPostId(id)) notFound();
  const name = decode(tag);
  const posts = await getTagPosts(id, 1).then((r) => r.posts).catch((e): GalleryPostSimple[] => {
    if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
    throw e;
  });
  await rememberItems(posts);
  return (
    <Container className="py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-subtle">
        <Link href={routes.ideabank.index()} className="hover:text-brand">Idea Bank</Link> <span aria-hidden>/</span> <span className="text-ink-3">{name}</span>
      </nav>
      <PageHeading eyebrow="Style" title={name} subtitle={`Design ideas tagged ${name}.`} />
      <GalleryGrid type="interior" tags={[id]} initial={posts} />
    </Container>
  );
}
