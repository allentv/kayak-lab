/**
 * Session Detail Page
 *
 * Per-session event timeline with filtering and detail view.
 */

import type { RouteConfig } from "fresh";
import { SessionInspectorIsland } from "../../../islands/SessionInspectorIsland.tsx";

export const config: RouteConfig = {
  layout: "default",
};

export default function SessionDetail(props: { params: { harness: string; id: string } }) {
  const { harness, id } = props.params;

  return (
    <div class="session-detail">
      <h1>Session Inspector</h1>
      <SessionInspectorIsland harness={harness} sessionId={id} />
    </div>
  );
}
