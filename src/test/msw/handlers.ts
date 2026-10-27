import { http, HttpResponse } from "msw";
import anonymous from "../fixtures/foundation/session-anonymous.json";

/** Default /bff/* handlers for component tests, built from fixtures (F11). */
export const handlers = [http.get("*/bff/session", () => HttpResponse.json(anonymous))];
