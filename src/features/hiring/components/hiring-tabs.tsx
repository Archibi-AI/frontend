"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/shared/lib/cn";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { HIRING_TYPES, type HiringType } from "../model/types";

/** Designer · Constructor · Landscape (HiringMainMenuViewModel.TYPES). */
export function HiringTabs({ type }: { type: HiringType }) {
  const router = useRouter();
  const [, start] = useTransition();
  const select = (v: string) => start(() => router.replace(`/hiring?type=${v}`, { scroll: false }));
  return (
    <>
      {/* Phones: the app's SelectorTabs. */}
      <div className="mb-3 flex gap-1.5 md:hidden">
        {HIRING_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={type === t.value}
            onClick={() => type !== t.value && select(t.value)}
            className={cn("h-10 min-w-0 flex-1 truncate rounded-[5px] border px-1 text-[15px] font-bold", type === t.value ? "border-white bg-gray-500 text-white" : "border-gray-500 bg-surface text-gray-500")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Tabs value={type} onValueChange={select} className="mb-6 hidden md:block">
        <TabsList label="Professional type">
          {HIRING_TYPES.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}
