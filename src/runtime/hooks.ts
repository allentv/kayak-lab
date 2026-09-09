/**
 * Lifecycle hook system for AgentRuntime.
 *
 * Provides registration, dispatch with timeout enforcement,
 * error isolation, and session-scoped vs global hooks.
 */

// ============================================================================
// Hook Types
// ============================================================================

/** Lifecycle points where hooks can be registered. */
export enum HookPoint {
  BeforeModelCall = "before_model_call",
  AfterToolExecution = "after_tool_execution",
  TurnEnd = "turn_end",
  SessionStart = "session_start",
  SessionEnd = "session_end",
}

/** Context passed to before_model_call hooks. */
export interface BeforeModelCallContext {
  sessionId: string;
  messages: Array<{ role: string; content: string; tool_call_id?: string }>;
  model?: string;
  tools?: unknown[];
}

/** Context passed to after_tool_execution hooks. */
export interface AfterToolExecutionContext {
  sessionId: string;
  toolName: string;
  toolParams: unknown;
  result: unknown;
  success: boolean;
  error?: string;
}

/** Context passed to turn_end hooks. */
export interface TurnEndContext {
  sessionId: string;
  turnNumber: number;
  response: string;
  provenanceNodes: string[];
}

/** Context passed to session_start hooks. */
export interface SessionStartContext {
  sessionId: string;
  config?: Record<string, unknown>;
}

/** Context passed to session_end hooks. */
export interface SessionEndContext {
  sessionId: string;
  state: string;
  durationMs: number;
  attestation?: unknown;
}

/** Union of all hook contexts. */
export type HookContext =
  | BeforeModelCallContext
  | AfterToolExecutionContext
  | TurnEndContext
  | SessionStartContext
  | SessionEndContext;

/** Hook function type. */
export type HookFunction = (context: HookContext) => Promise<void> | void;

/** Registered hook entry. */
export interface HookEntry {
  id: string;
  hookPoint: HookPoint;
  fn: HookFunction;
  sessionId?: string; // undefined = global hook
  timeoutMs: number;
}

// ============================================================================
// Hook Registry
// ============================================================================

/**
 * Registry for lifecycle hooks with dispatch, timeout, and error isolation.
 */
export class HookRegistry {
  private hooks = new Map<string, HookEntry>();
  private nextId = 1;

  /**
   * Register a hook at a lifecycle point.
   *
   * @param hookPoint - Lifecycle point to hook into
   * @param fn - Async or sync hook function
   * @param options - Optional: sessionId for scoped hooks, timeoutMs
   * @returns Hook ID for unregistration
   */
  register(
    hookPoint: HookPoint,
    fn: HookFunction,
    options?: { sessionId?: string; timeoutMs?: number },
  ): string {
    const id = `hook_${this.nextId++}`;
    const entry: HookEntry = {
      id,
      hookPoint,
      fn,
      sessionId: options?.sessionId,
      timeoutMs: options?.timeoutMs ?? 5000,
    };
    this.hooks.set(id, entry);
    return id;
  }

  /**
   * Unregister a hook by ID.
   *
   * @param hookId - ID returned from register()
   * @returns true if hook was found and removed
   */
  unregister(hookId: string): boolean {
    return this.hooks.delete(hookId);
  }

  /**
   * Get all hooks registered at a lifecycle point.
   *
   * @param hookPoint - Lifecycle point
   * @param sessionId - Optional session ID to filter scoped hooks
   * @returns Array of hook entries in registration order
   */
  getHooks(hookPoint: HookPoint, sessionId?: string): HookEntry[] {
    const entries: HookEntry[] = [];
    for (const hook of this.hooks.values()) {
      if (hook.hookPoint !== hookPoint) continue;

      // Include global hooks and session-scoped hooks for this session
      if (hook.sessionId === undefined || hook.sessionId === sessionId) {
        entries.push(hook);
      }
    }
    return entries;
  }

  /**
   * Dispatch all hooks at a lifecycle point.
   *
   * Hooks are called in registration order. Each hook has a timeout.
   * Errors are caught and logged, never propagated.
   *
   * @param hookPoint - Lifecycle point to dispatch
   * @param context - Context to pass to hooks
   * @param sessionId - Optional session ID for scoped hook filtering
   */
  async dispatch(
    hookPoint: HookPoint,
    context: HookContext,
    sessionId?: string,
  ): Promise<void> {
    const hooks = this.getHooks(hookPoint, sessionId);

    for (const hook of hooks) {
      try {
        await this.executeWithTimeout(hook.fn, context, hook.timeoutMs, hook.id);
      } catch (error) {
        // Error already logged in executeWithTimeout; continue to next hook
        console.error(
          `[HookRegistry] Hook ${hook.id} at ${hookPoint} failed:`,
          error,
        );
      }
    }
  }

  /**
   * Execute a hook function with timeout enforcement.
   */
  private async executeWithTimeout(
    fn: HookFunction,
    context: HookContext,
    timeoutMs: number,
    hookId: string,
  ): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    const timer = setTimeout(() => {
      reject(new Error(`Hook ${hookId} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    Promise.resolve()
      .then(() => fn(context))
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });

    return promise;
  }

  /**
   * Get the number of registered hooks.
   */
  get size(): number {
    return this.hooks.size;
  }

  /**
   * Clear all registered hooks.
   */
  clear(): void {
    this.hooks.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Global hook registry instance. */
export const hookRegistry = new HookRegistry();
