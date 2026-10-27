"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { safeNext } from "@/shared/config/routes";
import { useToast } from "@/shared/ui/toast";
import type { AuthResult } from "../model/user";

export const RESTORED_TOAST = "Welcome back! Your account deletion was cancelled."; // KMP strings.xml:192

/** After a successful sign-in/up: refresh session state, show the app's restore toast, go to `next`. */
export function useFinishSignIn(next: string | null) {
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  return async (result: AuthResult, welcome?: string) => {
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    if (result.accountRestored) toast({ kind: "success", title: RESTORED_TOAST });
    else if (welcome) toast({ kind: "success", title: welcome });
    router.replace(safeNext(next));
    router.refresh();
  };
}
