import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Container } from "@/shared/layout/container";
import { EmptyState } from "@/shared/ui/empty-state";

export default function NotFound() {
  return (
    <Container>
      <EmptyState
        title="Page not found"
        action={
          <div className="flex gap-4 text-sm font-medium text-brand">
            <Link href={routes.ideabank.index()}>Idea Bank</Link>
            <Link href={routes.hiring.index()}>Pros</Link>
            <Link href={routes.ai.index()}>AI Design</Link>
          </div>
        }
      />
    </Container>
  );
}
