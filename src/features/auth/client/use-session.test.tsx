import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { makeQueryClient } from "@/shared/http/query-client";
import signedIn from "@/test/fixtures/foundation/session-user.json";
import { server } from "@/test/msw/server";
import { useSession } from "./use-session";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={makeQueryClient()}>{children}</QueryClientProvider>;

describe("useSession (F10 Q4)", () => {
  it("anonymous", async () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("anonymous"));
  });
  it("authenticated", async () => {
    server.use(http.get("*/bff/session", () => HttpResponse.json(signedIn)));
    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user?.email).toBe("web-tester@example.com");
  });
});
