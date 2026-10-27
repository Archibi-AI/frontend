/** The only place URLs are spelled (architecture/04). Mirrors the app routes (README route map). */
const enc = encodeURIComponent;

export type GalleryType = "interior" | "exterior" | "landscape";
export type BillingSection = "all" | "credits" | "subscriptions";

export const routes = {
  auth: {
    login: (next?: string) => `/auth/login${next ? `?next=${enc(next)}` : ""}`,
    /** The session behind this tab was revoked (deleted account, signed out elsewhere): the proxy clears its cookies. */
    reauth: (next?: string) => `/auth/login?${next ? `next=${enc(next)}&` : ""}reauth=1`,
    signup: () => "/auth/signup",
    verify: (email: string) => `/auth/signup/verify?email=${enc(email)}`,
    forgotPassword: () => "/auth/forgot-password",
    appleCallback: () => "/auth/apple/callback",
  },
  ideabank: {
    index: (type?: GalleryType) => `/ideabank${type ? `?type=${type}` : ""}`,
    tag: (tag: string, id: number | string) => `/ideabank/tag/${enc(tag)}/${id}`,
    post: (uuid: number | string) => `/ideabank/post/${uuid}`,
  },
  hiring: {
    index: () => "/hiring",
    section: (section: string) => `/hiring/section/${enc(section)}`,
    category: (category: string, section: string, uuid: string) => `/hiring/category/${enc(category)}/${enc(section)}/${uuid}`,
    tag: (tag: string) => `/hiring/tag/${enc(tag)}`,
    professional: (uuid: string) => `/hiring/professional/${uuid}`,
    professionalProjects: (uuid: string) => `/hiring/professional/${uuid}/projects`,
    wishlist: () => "/hiring/wishlist",
  },
  ai: {
    index: () => "/ai",
    interior: () => "/ai/interior",
    exterior: () => "/ai/exterior",
    landscape: () => "/ai/landscape",
    sketch: () => "/ai/sketch-to-render",
    furniture: () => "/ai/furniture-finder",
    result: (projectUuid: string) => `/ai/result/${projectUuid}`,
    outOfCredits: () => "/ai/out-of-credits",
    serviceNotInPlan: (service: string) => `/ai/service-not-in-plan?service=${enc(service)}`,
    error: () => "/ai/error",
    serverError: () => "/ai/server-error",
  },
  account: {
    index: () => "/account",
    projects: () => "/account/projects",
    favoriteIdeas: () => "/account/favorite-ideas",
    transactions: () => "/account/transactions",
    edit: () => "/account/edit",
    changePassword: () => "/account/change-password",
    managePlan: () => "/account/manage-plan",
    privacy: () => "/account/privacy",
    support: () => "/account/support",
  },
  billing: {
    index: (section: BillingSection = "all") => `/billing?section=${section}`,
    checkout: (kind: "credits" | "subscription", id: string) => `/billing/checkout/${kind}/${enc(id)}`,
    result: (q: { status: string; kind: "credits" | "subscription"; id: string; months?: number }) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(q)) if (v !== undefined) params.set(k, String(v));
      return `/billing/result?${params.toString()}`;
    },
  },
  // WordPress pages (KMP AuthenticationURLs.kt:9-12, ArchibiUrls.kt:8-14)
  wordpress: {
    home: "https://archibi.ca/",
    privacy: "https://archibi.ca/privacy-policy/",
    terms: "https://archibi.ca/terms-of-service/",
    faq: "https://archibi.ca/faq/",
    features: "https://archibi.ca/features/",
    userGuide: "https://archibi.ca/User-guide",
    feedback: "https://archibi.ca/feedback",
    about: "https://archibi.ca/about",
  },
} as const;

/** Prefixes owned by Next (GUARDRAILS R9). nginx (devops/03) uses the same list. */
export const OWNED_PREFIXES = ["/ideabank", "/hiring", "/ai", "/account", "/billing", "/auth", "/bff", "/_next", "/web-static"] as const;
/** Pages that require a session — every app screen that reads the user token. */
export const PROTECTED_PREFIXES = ["/account", "/billing", "/ai", "/hiring/wishlist"] as const;

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);
export const isOwnedPath = (path: string) => OWNED_PREFIXES.some((p) => matches(path, p));
export const isProtectedPath = (path: string) => PROTECTED_PREFIXES.some((p) => matches(path, p));

/** Only same-site, owned, non-BFF paths are valid `next` targets (open-redirect guard). */
export function safeNext(next: string | null | undefined, fallback = "/ideabank"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  const path = next.split("?")[0] ?? "";
  if (!isOwnedPath(path) || matches(path, "/bff") || matches(path, "/_next")) return fallback;
  return next;
}
