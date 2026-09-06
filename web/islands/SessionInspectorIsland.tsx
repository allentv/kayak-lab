/**
 * Session Inspector Island
 *
 * Interactive session detail view with event timeline.
 */

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface Event {
  sequence: number;
  timestamp: string;
  type: string;
  payload: unknown;
}

interface Props {
  harness: string;
  sessionId: string;
}

export function SessionInspectorIsland(props: Props) {
  const events = useSignal<Event[]>([]);
  const selectedEvent = useSignal<Event | null>(null);
  const typeFilter = useSignal<string[]>([]);

  useEffect(() => {
    // Connect to harness WebSocket
    const wsUrl = props.harness.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/events`);

    ws.onopen = () => {
      // Subscribe to this session's events
      ws.send(JSON.stringify({
        type: "subscribe",
        session_id: props.sessionId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "event") {
          events.value = [...events.value, {
            sequence: msg.event.sequence_number,
            timestamp: msg.event.timestamp,
            type: msg.event.event_type,
            payload: msg.event.payload,
          }];
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = (error) => {
      console.error(`Error connecting to ${props.harness}:`, error);
    };

    return () => {
      ws.close();
    };
  }, [props.harness, props.sessionId]);

  const filteredEvents = events.value.filter((e) =>
    typeFilter.value.length === 0 || typeFilter.value.includes(e.type)
  );

  const toggleTypeFilter = (type: string) => {
    if (typeFilter.value.includes(type)) {
      typeFilter.value = typeFilter.value.filter((t) => t !== type);
    } else {
      typeFilter.value = [...typeFilter.value, type];
    }
  };

  return (
    <div class="session-inspector">
      <div class="session-header">
        <h2>Session: {props.sessionId.slice(0, 8)}...</h2>
        <span class="harness-label">Harness: {props.harness}</span>
      </div>

      <div class="inspector-content">
        {/* Event Type Filter */}
        <div class="filter-panel">
          <h3>Filter by Type</h3>
          <div class="filter-options">
            {[...new Set(events.value.map((e) => e.type))].map((type) => (
              <label class="filter-option">
                <input
                  type="checkbox"
                  checked={typeFilter.value.includes(type)}
                  onChange={() => toggleTypeFilter(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Event Timeline */}
        <div class="event-timeline">
          <h3>Events ({filteredEvents.length})</h3>
          <div class="timeline-list">
            {filteredEvents.map((event) => (
              <div
                class={`timeline-item ${selectedEvent.value?.sequence === event.sequence ? "selected" : ""}`}
                onClick={() => selectedEvent.value = event}
              >
                <span class="event-sequence">#{event.sequence}</span>
                <span class="event-type">{event.type}</span>
                <span class="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <p class="empty-state">No events match filter</p>
            )}
          </div>
        </div>

        {/* Event Detail Panel */}
        <div class="event-detail">
          <h3>Event Detail</h3>
          {selectedEvent.value ? (
            <pre class="payload-json">
              {JSON.stringify(selectedEvent.value.payload, null, 2)}
            </pre>
          ) : (
            <p class="empty-state">Select an event to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
