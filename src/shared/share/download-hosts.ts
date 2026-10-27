/**
 * Which image hosts /bff/download may fetch. An allowlist (never "any URL"): the route fetches server-side, so an open
 * proxy would let anyone reach internal services. Production = the app's storage/CDN hosts; extra hosts via SHARE_DOWNLOAD_HOSTS.
 */
const BASE_SUFFIXES = [".amazonaws.com", ".cloudfront.net", "uritect.com", "archibi.ca"];
const DEV_HOSTS = ["localhost", "127.0.0.1", "host.docker.internal", "picsum.photos", "fastly.picsum.photos", "i.pravatar.cc"];

export function isDownloadableHost(hostname: string, extra = process.env.SHARE_DOWNLOAD_HOSTS ?? "", dev = process.env.NODE_ENV !== "production"): boolean {
  const host = hostname.toLowerCase();
  const extras = extra.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (extras.includes(host)) return true;
  if (dev && DEV_HOSTS.includes(host)) return true;
  return BASE_SUFFIXES.some((s) => (s.startsWith(".") ? host.endsWith(s) : host === s || host.endsWith(`.${s}`)));
}
