import { NextResponse } from "next/server";
import { redis } from "@/server/redis";

export const dynamic = "force-dynamic";

/** Container health: reflects the Redis dependency (unlike a bare liveness check). */
export async function GET(): Promise<NextResponse> {
  try {
    await redis().ping();
    return new NextResponse("ok", { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new NextResponse("redis unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
