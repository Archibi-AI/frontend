import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { makeQueryClient } from "@/shared/http/query-client";
import { ToastProvider } from "@/shared/ui/toast";
import { resetNavigation } from "./navigation-mock";
import { server } from "./msw/server";

/** Registers MSW + navigation reset for a component test file. Unhandled requests fail the test. */
export function setupComponentTest(): void {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  beforeEach(resetNavigation);
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}
