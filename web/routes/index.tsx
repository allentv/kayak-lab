/**
 * Dashboard Page
 *
 * Aggregated overview of all connected harnesses.
 */

import type { RouteConfig } from "fresh";
import { getAggregatedState } from "../lib/aggregation.ts";
import { connectFromEnv } from "../lib/harness-connection.ts";
import { DashboardIsland } from "../islands/DashboardIsland.tsx";

export const config: RouteConfig = {
  layout: "default",
};

export default function Dashboard() {
  // Connect to harnesses on first render
  connectFromEnv();

  const state = getAggregatedState();

  return (
    <div class="dashboard">
      <h1>Kayak-Lab Dashboard</h1>

      <DashboardIsland
        initialHarnesses={state.harnesses}
        initialSessions={state.sessions}
        initialEvents={state.events}
        initialCapabilities={state.capabilities}
      />
    </div>
  );
}
