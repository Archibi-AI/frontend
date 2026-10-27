import { notFound } from "next/navigation";
import { isPostId, PostModal } from "@/features/ideabank";

export default async function InterceptedPost({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  if (!isPostId(uuid)) notFound();
  return <PostModal uuid={Number(uuid)} />;
}
