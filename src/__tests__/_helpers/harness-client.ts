/**
 * Blackbox E2E test helper: typed HTTP client for the harness API.
 *
 * All methods make real HTTP requests to a running harness server.
 * No imports from src/.
 */

// ============================================================================
// Types
// ============================================================================

export interface HealthResponse {
  status: string;
  uptime: number;
  session_count: number;
  event_count: number;
}

export interface SessionSummary {
  id: string;
  state: string;
  created_at: string;
  updated_at: string;
  description?: string;
  event_count: number;
}

export interface SessionDetail extends SessionSummary {
  events: EventRecord[];
}

export interface EventRecord {
  event_type: string;
  sequence_number: number;
  session_id: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export interface CapabilitySummary {
  name: string;
  version: string;
  initialized: boolean;
}

export interface CorsHeaders {
  status: number;
  headers: Record<string, string>;
}

// ============================================================================
// Client
// ============================================================================

export class HarnessClient {
  constructor(private baseUrl: string) {}

  // -- Health --

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/api/health`);
    if (!res.ok) {
      throw new Error(`GET /api/health returned ${res.status}`);
    }
    return res.json() as Promise<HealthResponse>;
  }

  // -- Sessions --

  async getSessions(): Promise<SessionSummary[]> {
    const res = await fetch(`${this.baseUrl}/api/sessions`);
    if (!res.ok) {
      throw new Error(`GET /api/sessions returned ${res.status}`);
    }
    return res.json() as Promise<SessionSummary[]>;
  }

  async getSession(id: string): Promise<SessionDetail> {
    const res = await fetch(`${this.baseUrl}/api/sessions/${id}`);
    if (res.status === 404) {
      throw new HttpError(404, "Session not found");
    }
    if (!res.ok) {
      throw new Error(`GET /api/sessions/${id} returned ${res.status}`);
    }
    return res.json() as Promise<SessionDetail>;
  }

  async getSessionEvents(
    id: string,
    opts?: { type?: string; limit?: number },
  ): Promise<EventRecord[]> {
    const params = new URLSearchParams();
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit !== undefined) params.set("limit", String(opts.limit));

    const qs = params.toString();
    const url = `${this.baseUrl}/api/sessions/${id}/events${qs ? `?${qs}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET /api/sessions/${id}/events returned ${res.status}`);
    }
    return res.json() as Promise<EventRecord[]>;
  }

  // -- Capabilities --

  async getCapabilities(): Promise<CapabilitySummary[]> {
    const res = await fetch(`${this.baseUrl}/api/capabilities`);
    if (!res.ok) {
      throw new Error(`GET /api/capabilities returned ${res.status}`);
    }
    return res.json() as Promise<CapabilitySummary[]>;
  }

  // -- CORS --

  async options(path: string, origin?: string): Promise<CorsHeaders> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "OPTIONS",
      headers: {
        "Origin": origin ?? "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });

    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return { status: res.status, headers };
  }
}

// ============================================================================
// Errors
// ============================================================================

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
