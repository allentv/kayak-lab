/**
 * GET /api/sessions
 *
 * Returns all sessions from all harnesses with source labels.
 */

import type { RouteHandler } from "fresh";
import { getAggregatedState } from "../../lib/aggregation.ts";

export const handler: RouteHandler<unknown, unknown> = {
  async GET() {
    const state = await getAggregatedState();
    return Response.json(state.sessions);
  },
};
