/**
 * Health check system.
 *
 * Provides component-level health reporting with registration,
 * parallel execution, and Kubernetes-compatible endpoints.
 */

// ============================================================================
// Types
// ============================================================================

/** Health status of a single component. */
export interface ComponentHealth {
  /** Component name. */
  name: string;
  /** Whether the component is healthy. */
  healthy: boolean;
  /** Status message. */
  message: string;
  /** Check duration in milliseconds. */
  duration_ms: number;
}

/** Aggregate health status. */
export type AggregateStatus = "healthy" | "degraded" | "unhealthy";

/** Full health check result. */
export interface HealthCheckResult {
  /** Aggregate status. */
  status: AggregateStatus;
  /** Timestamp of the check. */
  timestamp: string;
  /** Individual component results. */
  components: ComponentHealth[];
}

/** Structured error response format. */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

// ============================================================================
// Health Registry
// ============================================================================

/** Health check function type. */
export type HealthCheckFn = () => Promise<ComponentHealth> | ComponentHealth;

/** Default timeout per health check (ms). */
const DEFAULT_TIMEOUT_MS = 1000;

/**
 * Registry for component health checks.
 *
 * Components register health check functions at startup.
 * Checks run in parallel with configurable timeout.
 */
export class HealthRegistry {
  private checks = new Map<string, HealthCheckFn>();
  private timeoutMs: number;

  constructor(timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Register a health check function.
   */
  register(name: string, checkFn: HealthCheckFn): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Deregister a health check.
   */
  deregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all registered health checks in parallel.
   * Each check has a timeout. Returns aggregate status.
   */
  async check(): Promise<HealthCheckResult> {
    const entries = Array.from(this.checks.entries());

    // Run all checks in parallel with timeout
    const results = await Promise.all(
      entries.map(([name, fn]) => this.runCheck(name, fn)),
    );

    // Determine aggregate status
    const healthyCount = results.filter((r) => r.healthy).length;
    const totalCount = results.length;

    let status: AggregateStatus;
    if (totalCount === 0) {
      status = "healthy"; // No checks = nothing to fail
    } else if (healthyCount === totalCount) {
      status = "healthy";
    } else if (healthyCount > 0) {
      status = "degraded";
    } else {
      status = "unhealthy";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      components: results,
    };
  }

  /**
   * Run a single health check with timeout.
   */
  private async runCheck(
    name: string,
    fn: HealthCheckFn,
  ): Promise<ComponentHealth> {
    const start = Date.now();

    try {
      const result = await Promise.race([
        Promise.resolve(fn()),
        this.timeoutPromise(name),
      ]);

      return {
        ...result,
        duration_ms: Date.now() - start,
      };
    } catch (err) {
      return {
        name,
        healthy: false,
        message: err instanceof Error ? err.message : String(err),
        duration_ms: Date.now() - start,
      };
    }
  }

  /**
   * Creates a promise that rejects after timeout.
   */
  private timeoutPromise(name: string): Promise<never> {
    const { promise, reject } = Promise.withResolvers<never>();
    setTimeout(() => {
      reject(new Error(`Health check '${name}' timed out after ${this.timeoutMs}ms`));
    }, this.timeoutMs);
    return promise;
  }
}

// ============================================================================
// HTTP Handler
// ============================================================================

/**
 * Create HTTP handler for health endpoints.
 */
export function createHealthHandler(registry: HealthRegistry) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/health") {
      return handleHealth(registry);
    }
    if (path === "/ready") {
      return handleReady(registry);
    }
    if (path === "/alive") {
      return handleAlive();
    }

    return new Response(
      JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  };
}

async function handleHealth(registry: HealthRegistry): Promise<Response> {
  const result = await registry.check();
  const status = result.status === "unhealthy" ? 503 : 200;

  return new Response(
    JSON.stringify(result),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

async function handleReady(registry: HealthRegistry): Promise<Response> {
  const result = await registry.check();
  const ready = result.status !== "unhealthy";

  return new Response(
    JSON.stringify({ ready, status: result.status }),
    {
      status: ready ? 200 : 503,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function handleAlive(): Response {
  return new Response(
    JSON.stringify({ alive: true, timestamp: new Date().toISOString() }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create a structured error response.
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create an HTTP Response with structured error format.
 */
export function errorHttpResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify(errorResponse(code, message, details)),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    },
  );
}
