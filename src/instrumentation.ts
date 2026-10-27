export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("@/server/env");
    env(); // throws on a missing/invalid variable → container restarts with a clear log
  }
}
