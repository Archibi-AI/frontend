import { routes } from "@/shared/config/routes";

/** Web mirror of KMP MainTab. */
export const PRIMARY_NAV = [
  { href: routes.home(), label: "Home", match: "/" },
  { href: routes.ideabank.index(), label: "Idea Bank", match: "/ideabank" },
  { href: routes.hiring.index(), label: "Pros", match: "/hiring" },
  { href: routes.ai.index(), label: "AI Design", match: "/ai" },
  { href: routes.account.projects(), label: "Projects", match: "/account/projects" },
] as const;

export const isActive = (pathname: string, match: string) => pathname === match || pathname.startsWith(`${match}/`);
