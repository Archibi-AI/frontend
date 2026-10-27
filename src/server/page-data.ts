import "server-only";
import { redirect } from "next/navigation";
import { routes } from "@/shared/config/routes";
import { AppError } from "@/shared/errors/app-error";

/** Server-component data loading: a dead session goes to login (with `next`); other errors reach error.tsx. */
export async function loadPage<T>(path: string, load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") redirect(routes.auth.reauth(path));
    throw e;
  }
}
