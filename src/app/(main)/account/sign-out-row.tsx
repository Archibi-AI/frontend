"use client";
import type { ReactNode } from "react";
import { SignOutDialog } from "@/features/auth";

/** Client boundary so the server page can pass a plain trigger element into the dialog. */
export function AccountButtonRowSignOut({ trigger }: { trigger: ReactNode }) {
  return <SignOutDialog trigger={trigger} />;
}
