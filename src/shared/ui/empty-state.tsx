import type { ReactNode } from "react";

export function EmptyState({ icon, title, action }: { icon?: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon}
      <p className="text-base text-muted">{title}</p>
      {action}
    </div>
  );
}
