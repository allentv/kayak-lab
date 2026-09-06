/**
 * Aggregation Layer
 *
 * Merges sessions, events, and capabilities from all harnesses
 * into a unified state for the web UI.
 */

// ============================================================================
// Types
// ============================================================================

export interface AggregatedSession {
  harness: string;
  id: string;
  state: string;
  created_at: string;
  event_count: number;
}

export interface AggregatedEvent {
  harness: string;
  sequence: number;
  timestamp: string;
  type: string;
  payload: unknown;
}

export interface AggregatedCapability {
  harness: string;
  name: string;
  version: string;
  initialized: boolean;
}

export interface AggregatedState {
  sessions: AggregatedSession[];
  events: AggregatedEvent[];
  capabilities: AggregatedCapability[];
  harnesses: HarnessStatus[];
}

export interface HarnessStatus {
  url: string;
  status: "connected" | "disconnected";
  session_count: number;
  event_count: number;
}

// ============================================================================
// State
// ============================================================================

const state = {
  sessions: new Map<string, AggregatedSession[]>(),
  events: new Map<string, AggregatedEvent[]>(),
  capabilities: new Map<string, AggregatedCapability[]>(),
  harnessStatus: new Map<string, HarnessStatus>(),
  listeners: new Set<(state: AggregatedState) => void>(),
};

const MAX_EVENTS = 1000;

// ============================================================================
// Public API
// ============================================================================

/**
 * Handle event from a harness.
 */
export function onHarnessEvent(harnessUrl: string, event: unknown): void {
  const e = event as { type?: string; session_id?: string; sequence_number?: number; timestamp?: string; event_type?: string; payload?: unknown };

  // Track event
  if (!state.events.has(harnessUrl)) {
    state.events.set(harnessUrl, []);
  }

  const events = state.events.get(harnessUrl)!;
  events.push({
    harness: harnessUrl,
    sequence: e.sequence_number ?? 0,
    timestamp: e.timestamp ?? new Date().toISOString(),
    type: e.event_type ?? "unknown",
    payload: e.payload ?? {},
  });

  // Keep only last MAX_EVENTS per harness
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  // Update session if needed
  if (e.session_id) {
    updateSession(harnessUrl, e.session_id, e.type ?? "unknown");
  }

  notifyListeners();
}

/**
 * Update session state from harness.
 */
function updateSession(harnessUrl: string, sessionId: string, eventType: string): void {
  if (!state.sessions.has(harnessUrl)) {
    state.sessions.set(harnessUrl, []);
  }

  const sessions = state.sessions.get(harnessUrl)!;
  const existing = sessions.find((s) => s.id === sessionId);

  if (existing) {
    // Update event count
    existing.event_count++;

    // Update state based on event type
    if (eventType.startsWith("session.")) {
      existing.state = eventType.split(".")[1] ?? existing.state;
    }
  } else {
    // Create new session
    sessions.push({
      harness: harnessUrl,
      id: sessionId,
      state: eventType.startsWith("session.") ? eventType.split(".")[1] ?? "created" : "created",
      created_at: new Date().toISOString(),
      event_count: 1,
    });
  }
}

/**
 * Update capabilities from harness.
 */
export function updateCapabilities(harnessUrl: string, capabilities: unknown[]): void {
  state.capabilities.set(
    harnessUrl,
    capabilities.map((cap) => {
      const c = cap as { name?: string; version?: string; initialized?: boolean };
      return {
        harness: harnessUrl,
        name: c.name ?? "unknown",
        version: c.version ?? "0.0.0",
        initialized: c.initialized ?? false,
      };
    }),
  );
  notifyListeners();
}

/**
 * Update harness connection status.
 */
export function updateHarnessStatus(
  url: string,
  status: "connected" | "disconnected",
): void {
  state.harnessStatus.set(url, {
    url,
    status,
    session_count: state.sessions.get(url)?.length ?? 0,
    event_count: state.events.get(url)?.length ?? 0,
  });
  notifyListeners();
}

/**
 * Get aggregated state.
 */
export function getAggregatedState(): AggregatedState {
  const allSessions: AggregatedSession[] = [];
  for (const sessions of state.sessions.values()) {
    allSessions.push(...sessions);
  }

  const allEvents: AggregatedEvent[] = [];
  for (const events of state.events.values()) {
    allEvents.push(...events);
  }

  // Sort events by timestamp descending (most recent first)
  allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const allCapabilities: AggregatedCapability[] = [];
  for (const capabilities of state.capabilities.values()) {
    allCapabilities.push(...capabilities);
  }

  return {
    sessions: allSessions,
    events: allEvents.slice(0, 50), // Last 50 events
    capabilities: allCapabilities,
    harnesses: Array.from(state.harnessStatus.values()),
  };
}

/**
 * Subscribe to state changes.
 */
export function onStateChange(
  listener: (state: AggregatedState) => void,
): () => void {
  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

/**
 * Notify listeners of state changes.
 */
function notifyListeners(): void {
  const aggregated = getAggregatedState();
  for (const listener of state.listeners) {
    listener(aggregated);
  }
}
