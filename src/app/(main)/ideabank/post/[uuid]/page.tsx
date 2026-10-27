import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPostId, PostView } from "@/features/ideabank";
import { loadPostOrNotFound } from "@/features/ideabank/server/post";
import { routes } from "@/shared/config/routes";
import { Container } from "@/shared/layout/container";
import { buttonVariants } from "@/shared/ui/button";

type Params = Promise<{ uuid: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { uuid } = await params;
  if (!isPostId(uuid)) return { title: "Idea" };
  const post = await loadPostOrNotFound(Number(uuid));
  const style = post.tags[0]?.tag;
  return {
    title: style ? `${style} design idea` : "Design idea",
    alternates: { canonical: routes.ideabank.post(uuid) },
    // Without the remembered picture there is nothing worth indexing (no invented content).
    robots: post.item ? undefined : { index: false },
    openGraph: post.item ? { images: [post.item.image] } : undefined,
  };
}

/** Direct load of one idea. In the feed the same route opens as a modal (@modal/(.)post/[uuid]). */
export default async function PostPage({ params }: { params: Params }) {
  const { uuid } = await params;
  if (!isPostId(uuid)) notFound();
  const post = await loadPostOrNotFound(Number(uuid));
  return (
    <Container className="py-8 md:py-12">
      <Link href={routes.ideabank.index()} className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-3" })}>
        ← Idea Bank
      </Link>
      <PostView post={post} />
    </Container>
  );
}
