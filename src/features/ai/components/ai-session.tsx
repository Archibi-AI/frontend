"use client";
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

interface AiSession { setBefore: (projectUuid: string, objectUrl: string) => void; getBefore: (projectUuid: string) => string | undefined }
const Ctx = createContext<AiSession | null>(null);

/** Keeps the upload's object URL per job for the before/after slider. Lost on reload by design (result plan B2). */
export function AiSessionProvider({ children }: { children: ReactNode }) {
  const map = useRef(new Map<string, string>());
  const setBefore = useCallback((id: string, url: string) => void map.current.set(id, url), []);
  const getBefore = useCallback((id: string) => map.current.get(id), []);
  const value = useMemo(() => ({ setBefore, getBefore }), [setBefore, getBefore]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAiSession(): AiSession {
  return useContext(Ctx) ?? { setBefore: () => undefined, getBefore: () => undefined };
}
