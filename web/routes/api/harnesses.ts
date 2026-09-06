/**
 * GET /api/harnesses
 *
 * Returns list of configured harnesses with connection status.
 */

import type { RouteHandler } from "fresh";
import { getHarnessConnections } from "../../lib/harness-connection.ts";

export const handler: RouteHandler<unknown, unknown> = {
  GET() {
    const connections = getHarnessConnections();
    const harnesses = Array.from(connections.values()).map((conn) => ({
      url: conn.url,
      status: conn.status,
    }));

    return Response.json(harnesses);
  },
};
