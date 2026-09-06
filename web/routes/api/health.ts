/**
 * GET /api/health
 *
 * Returns UI health with harness connection summary.
 */

import type { RouteHandler } from "fresh";
import { getAggregatedState } from "../../lib/aggregation.ts";
import { getHarnessConnections } from "../../lib/harness-connection.ts";

export const handler: RouteHandler<unknown, unknown> = {
  GET() {
    const state = getAggregatedState();
    const connections = getHarnessConnections();

    const harnessStatus = Array.from(connections.values()).map((conn) => ({
      url: conn.url,
      status: conn.status,
    }));

    return Response.json({
      status: "ok",
      harnesses: harnessStatus,
      total_sessions: state.sessions.length,
      total_events: state.events.length,
    });
  },
};
