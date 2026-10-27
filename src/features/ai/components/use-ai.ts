"use client";
import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/shared/http/bff-fetch";
import type { AppError } from "@/shared/errors/app-error";
import type { Credits, FilterResponse, JobView, RecentJob } from "../schemas";
import type { Mode, RedesignPart } from "../model/redesign";

/** The app reloads credits on every AI screen open (FilterScreen.kt:91-93), hence staleTime 0. */
export const useCredits = () => useQuery<Credits, AppError>({ queryKey: ["me", "credits"], queryFn: () => bffFetch<Credits>("/bff/ai/credits"), staleTime: 0 });

export const useFilters = (part: RedesignPart, section: Mode | "sketch-to-render") =>
  useQuery<FilterResponse, AppError>({
    queryKey: ["ai", "filters", part, section],
    queryFn: () => bffFetch<FilterResponse>("/bff/ai/filters", { query: { part, section } }),
    staleTime: 5 * 60_000,
  });

export const POLL_MS = 2_500;
export const POLL_GIVE_UP_MS = 12 * 60_000;
export const isActiveState = (s: string | undefined) => s === "running" || s === "saving";

/** Polls a job every 2.5 s while it runs; the page itself stops after 12 min (result plan B2). */
export const useJob = (projectUuid: string) =>
  useQuery<JobView, AppError>({
    queryKey: ["me", "aijob", projectUuid],
    queryFn: () => bffFetch<JobView>(`/bff/ai/jobs/${projectUuid}`),
    staleTime: 0,
    retry: false,
    refetchInterval: (q) => (isActiveState(q.state.data?.state) ? POLL_MS : false),
  });

export const useRecentJobs = () => useQuery<RecentJob[], AppError>({ queryKey: ["me", "aijobs"], queryFn: () => bffFetch<RecentJob[]>("/bff/ai/jobs"), staleTime: 0 });
