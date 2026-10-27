"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { HIRING_TYPES, type HiringType } from "../model/types";

/** Designer · Constructor · Landscape (HiringMainMenuViewModel.TYPES). */
export function HiringTabs({ type }: { type: HiringType }) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <Tabs value={type} onValueChange={(v) => start(() => router.replace(`/hiring?type=${v}`, { scroll: false }))} className="mb-6">
      <TabsList label="Professional type">
        {HIRING_TYPES.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
