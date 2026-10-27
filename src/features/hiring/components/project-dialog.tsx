"use client";
import { MapPin, Share2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { ShareDialog } from "@/shared/share/share-dialog";
import { RemoteImage } from "@/shared/ui/remote-image";
import type { ProProject } from "../schemas";

export type ProjectInfo = Pick<ProProject, "uuid" | "image" | "title" | "location"> & { description?: string };

/** The app's share text (ProPostScreen): "Look at the project i found at Archibi designed by …". */
export const shareText = (name: string, p: ProjectInfo) => `Look at the project i found at Archibi designed by ${name}\n${p.title}\n${p.description ?? ""}`.trim();

/**
 * Project popup (ProPostScreen.kt): image, title + share, location, description clamped to 4 lines with
 * "See more" / "See less" that appears only when something is cut off (or is expanded).
 */
export function ProjectDialog({ project, professionalName, open, onOpenChange }: { project: ProjectInfo; professionalName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [sharing, setSharing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const description = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (!open || expanded) return;
    const cut = (el: HTMLElement | null) => !!el && el.scrollHeight > el.clientHeight + 1;
    setOverflows(cut(title.current) || cut(description.current));
  }, [open, expanded, project]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setExpanded(false); onOpenChange(o); }}>
      <DialogContent size="md" className="p-0 md:p-0">
        <div className="aspect-[4/3] bg-track">
          {project.image && <RemoteImage src={project.image} alt={project.title} className="size-full object-cover" />}
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-start gap-3">
            <DialogTitle className={`min-w-0 flex-1 text-base ${expanded ? "" : "line-clamp-1"}`}>
              <span ref={title} className={`block ${expanded ? "" : "line-clamp-1"}`}>{project.title || "Project"}</span>
            </DialogTitle>
            <button type="button" onClick={() => setSharing(true)} aria-label="Share" className="shrink-0 rounded-pill p-2 text-subtle hover:text-brand">
              <Share2 className="size-5" aria-hidden />
            </button>
          </div>
          {project.location && (
            <p className="flex items-center gap-2 text-sm text-ink-3">
              <MapPin className="size-4 shrink-0" aria-hidden /> {project.location}
            </p>
          )}
          <DialogDescription asChild>
            <p ref={description} className={`whitespace-pre-line text-sm text-muted ${expanded ? "" : "line-clamp-4"}`}>
              {project.description || "No description provided."}
            </p>
          </DialogDescription>
          {(expanded || overflows) && (
            <button type="button" onClick={() => setExpanded((e) => !e)} className="text-sm font-medium text-brand hover:underline">
              {expanded ? "See less" : "See more"}
            </button>
          )}
        </div>
      </DialogContent>
      <ShareDialog open={sharing} onOpenChange={setSharing} title={project.title} url={typeof window === "undefined" ? "" : window.location.href} text={shareText(professionalName, project)} imageUrl={project.image} />
    </Dialog>
  );
}
