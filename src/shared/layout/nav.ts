import { routes } from "@/shared/config/routes";

/** Web mirror of KMP MainTab (Home→AI because Home is out of scope, D3). */
export const PRIMARY_NAV = [
  { href: routes.ideabank.index(), label: "Idea Bank", match: "/ideabank" },
  { href: routes.hiring.index(), label: "Pros", match: "/hiring" },
  { href: routes.ai.index(), label: "AI Design", match: "/ai" },
  { href: routes.account.projects(), label: "Projects", match: "/account/projects" },
] as const;

export const isActive = (pathname: string, match: string) => pathname === match || pathname.startsWith(`${match}/`);
