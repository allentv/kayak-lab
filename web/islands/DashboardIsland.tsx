/**
 * Dashboard Island
 *
 * Interactive dashboard component that receives real-time updates
 * via WebSocket from connected harnesses.
 */

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface HarnessStatus {
  url: string;
  status: "connected" | "disconnected";
}

interface Session {
  harness: string;
  id: string;
  state: string;
  created_at: string;
  event_count: number;
}

interface Event {
  harness: string;
  sequence: number;
  timestamp: string;
  type: string;
  payload: unknown;
}

interface Capability {
  harness: string;
  name: string;
  version: string;
  initialized: boolean;
}

interface Props {
  initialHarnesses: HarnessStatus[];
  initialSessions: Session[];
  initialEvents: Event[];
  initialCapabilities: Capability[];
}

export function DashboardIsland(props: Props) {
  const harnesses = useSignal(props.initialHarnesses);
  const sessions = useSignal(props.initialSessions);
  const events = useSignal(props.initialEvents);
  const capabilities = useSignal(props.initialCapabilities);

  useEffect(() => {
    // Connect to harnesses via WebSocket
    const wsUrls = harnesses.value.map((h) => h.url.replace(/^http/, "ws"));
    const connections: WebSocket[] = [];

    for (const url of wsUrls) {
      try {
        const ws = new WebSocket(`${url}/ws/events`);

        ws.onopen = () => {
          console.log(`Connected to ${url}`);
          // Subscribe to all events
          ws.send(JSON.stringify({ type: "subscribe" }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "event") {
              // Update events list
              events.value = [msg.event, ...events.value].slice(0, 50);
            }
          } catch {
            // Ignore malformed messages
          }
        };

        ws.onerror = (error) => {
          console.error(`Error connecting to ${url}:`, error);
        };

        ws.onclose = () => {
          console.log(`Disconnected from ${url}`);
          // Update harness status
          harnesses.value = harnesses.value.map((h) =>
            h.url === url.replace(/^ws/, "http")
              ? { ...h, status: "disconnected" }
              : h
          );
        };

        connections.push(ws);
      } catch (error) {
        console.error(`Failed to connect to ${url}:`, error);
      }
    }

    // Cleanup on unmount
    return () => {
      for (const ws of connections) {
        ws.close();
      }
    };
  }, []);

  return (
    <div class="dashboard-content">
      {/* Harness Status Panel */}
      <section class="panel harness-status">
        <h2>Harnesses</h2>
        <div class="harness-grid">
          {harnesses.value.map((harness) => (
            <div class={`harness-card ${harness.status}`}>
              <span class="harness-url">{harness.url}</span>
              <span class={`status-badge ${harness.status}`}>
                {harness.status}
              </span>
            </div>
          ))}
          {harnesses.value.length === 0 && (
            <p class="empty-state">No harnesses connected</p>
          )}
        </div>
      </section>

      {/* Sessions Table */}
      <section class="panel sessions-table">
        <h2>Sessions ({sessions.value.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Harness</th>
              <th>ID</th>
              <th>State</th>
              <th>Created</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {sessions.value.map((session) => (
              <tr>
                <td>{session.harness}</td>
                <td class="session-id">{session.id.slice(0, 8)}...</td>
                <td>
                  <span class={`state-badge ${session.state}`}>
                    {session.state}
                  </span>
                </td>
                <td>{new Date(session.created_at).toLocaleString()}</td>
                <td>{session.event_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sessions.value.length === 0 && (
          <p class="empty-state">No sessions yet</p>
        )}
      </section>

      {/* Capabilities Panel */}
      <section class="panel capabilities">
        <h2>Capabilities ({capabilities.value.length})</h2>
        <div class="capability-grid">
          {capabilities.value.map((cap) => (
            <div class="capability-card">
              <span class="cap-name">{cap.name}</span>
              <span class="cap-version">v{cap.version}</span>
              <span class={`cap-status ${cap.initialized ? "initialized" : "uninitialized"}`}>
                {cap.initialized ? "Ready" : "Not initialized"}
              </span>
            </div>
          ))}
          {capabilities.value.length === 0 && (
            <p class="empty-state">No capabilities loaded</p>
          )}
        </div>
      </section>

      {/* Recent Events Feed */}
      <section class="panel events-feed">
        <h2>Recent Events ({events.value.length})</h2>
        <div class="event-list">
          {events.value.map((event) => (
            <div class="event-item">
              <span class="event-harness">{event.harness}</span>
              <span class="event-type">{event.type}</span>
              <span class="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {events.value.length === 0 && (
            <p class="empty-state">No events yet</p>
          )}
        </div>
      </section>
    </div>
  );
}
