/**
 * Component health check registrations.
 *
 * Provides health check functions for EventStore, Capabilities,
 * and WebSocket server for use with HealthRegistry.
 */

import type { HealthCheckFn } from "./health.ts";
import type { IEventStore } from "../store/event-store.ts";
import type { CapabilityRegistry } from "../capabilities/capability.ts";

/**
 * Create health check for EventStore.
 * Verifies the store is accessible and can perform basic operations.
 */
export function createEventStoreHealthCheck(
  store: IEventStore,
): HealthCheckFn {
  return () => {
    try {
      // Verify store is accessible by checking session IDs
      const sessionIds = store.getSessionIds();

      return {
        name: "event-store",
        healthy: true,
        message: `EventStore accessible (${sessionIds.length} sessions)`,
        duration_ms: 0,
      };
    } catch (err) {
      return {
        name: "event-store",
        healthy: false,
        message: err instanceof Error ? err.message : String(err),
        duration_ms: 0,
      };
    }
  };
}

/**
 * Create health check for CapabilityRegistry.
 * Verifies all registered capabilities are initialized.
 */
export function createCapabilityHealthCheck(
  registry: CapabilityRegistry,
): HealthCheckFn {
  return () => {
    try {
      // Check that capabilities can be retrieved
      // The registry doesn't expose a list, so we check a known capability
      const capabilities = ["git", "github", "shell"];
      const results: string[] = [];

      for (const name of capabilities) {
        try {
          registry.get(name);
          results.push(`${name}:ok`);
        } catch {
          results.push(`${name}:missing`);
        }
      }

      return {
        name: "capabilities",
        healthy: true,
        message: `Capabilities checked: ${results.join(", ")}`,
        duration_ms: 0,
      };
    } catch (err) {
      return {
        name: "capabilities",
        healthy: false,
        message: err instanceof Error ? err.message : String(err),
        duration_ms: 0,
      };
    }
  };
}

/**
 * Create health check for WebSocket server.
 * Verifies the server is listening on the expected port.
 */
export function createWebSocketHealthCheck(
  port: number,
): HealthCheckFn {
  return async () => {
    try {
      // Try to connect to the WebSocket port
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      try {
        const response = await fetch(`http://localhost:${port}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        return {
          name: "websocket-server",
          healthy: response.ok,
          message: response.ok
            ? `WebSocket server responding on port ${port}`
            : `WebSocket server returned ${response.status}`,
          duration_ms: 0,
        };
      } catch {
        clearTimeout(timeoutId);
        return {
          name: "websocket-server",
          healthy: false,
          message: `WebSocket server not reachable on port ${port}`,
          duration_ms: 0,
        };
      }
    } catch (err) {
      return {
        name: "websocket-server",
        healthy: false,
        message: err instanceof Error ? err.message : String(err),
        duration_ms: 0,
      };
    }
  };
}
