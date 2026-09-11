/**
 * Aggregation Layer
 *
 * SQL-backed aggregation for the web UI.
 * Replaces in-memory aggregation with DuckDB-backed queries.
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
// State (minimal in-memory for harness status only)
// ============================================================================

const state = {
  harnessStatus: new Map<string, HarnessStatus>(),
  listeners: new Set<(state: AggregatedState) => void>(),
};

// ============================================================================
// SQL-backed queries via /api/query endpoint
// ============================================================================

const API_BASE = "";

async function querySql<T>(sql: string): Promise<T[]> {
  const res = await fetch(`${API_BASE}/api/query?sql=${encodeURIComponent(sql)}`);
  if (!res.ok) {
    throw new Error(`Query failed: ${res.status}`);
  }
  const data = await res.json();
  return (data as { results: T[] }).results ?? [];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Handle event from a harness.
 * Events are now persisted to DuckDB; this function only notifies listeners.
 */
export function onHarnessEvent(_harnessUrl: string, _event: unknown): void {
  notifyListeners();
}

/**
 * Update capabilities from harness.
 * Capabilities are now persisted to DuckDB; this function only notifies listeners.
 */
export function updateCapabilities(_harnessUrl: string, _capabilities: unknown[]): void {
  notifyListeners();
}

/**
 * Update harness connection status.
 */
export function updateHarnessStatus(
  url: string,
  status: "connected" | "disconnected",
): void {
  const existing = state.harnessStatus.get(url);
  state.harnessStatus.set(url, {
    url,
    status,
    session_count: existing?.session_count ?? 0,
    event_count: existing?.event_count ?? 0,
  });
  notifyListeners();
}

/**
 * Get aggregated state from DuckDB via SQL queries.
 */
export async function getAggregatedState(): Promise<AggregatedState> {
  let allSessions: AggregatedSession[] = [];
  let allEvents: AggregatedEvent[] = [];
  const allCapabilities: AggregatedCapability[] = [];

  try {
    // Query sessions from DuckDB
    const sessions = await querySql<{
      session_id: string;
      total_events: number;
      created_at: string;
    }>(`
      SELECT
        session_id,
        COUNT(*) as total_events,
        MIN(timestamp) as created_at
      FROM events
      GROUP BY session_id
      ORDER BY created_at DESC
    `);

    allSessions = sessions.map((s) => ({
      harness: "duckdb",
      id: s.session_id,
      state: "created",
      created_at: s.created_at ?? new Date().toISOString(),
      event_count: s.total_events,
    }));

    // Query recent events from DuckDB
    const events = await querySql<{
      session_id: string;
      sequence: number;
      timestamp: string;
      event_type: string;
      payload: string;
    }>(`
      SELECT
        session_id,
        sequence_number as sequence,
        timestamp,
        event_type,
        payload::VARCHAR as payload
      FROM events
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    allEvents = events.map((e) => ({
      harness: "duckdb",
      sequence: e.sequence,
      timestamp: e.timestamp,
      type: e.event_type,
      payload: (() => { try { return JSON.parse(e.payload); } catch { return {}; } })(),
    }));
  } catch {
    // DuckDB not available, return empty state
  }

  return {
    sessions: allSessions,
    events: allEvents,
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
  getAggregatedState().then((aggregated) => {
    for (const listener of state.listeners) {
      listener(aggregated);
    }
  });
}
