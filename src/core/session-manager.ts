/**
 * Session manager implementation.
 *
 * Handles session lifecycle: create, resume, pause, complete, fail, cancel.
 * Enforces valid state transitions and maintains session state.
 */

import { v4 as uuidv4 } from "uuid";
import {
  EventTypes,
  SessionCreatedPayload,
} from "../types/events.ts";
import { IEventStream, EventStreamError } from "./event-stream.ts";

// ============================================================================
// Session Types
// ============================================================================

/** Valid session states. */
export type SessionState =
  | "active"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

/** Valid state transitions. */
const VALID_TRANSITIONS: Record<SessionState, Set<SessionState>> = {
  active: new Set(["paused", "completed", "failed", "cancelled"]),
  paused: new Set(["active"]),
  completed: new Set(),
  failed: new Set(),
  cancelled: new Set(),
};

/** Session information. */
export interface Session {
  id: string;
  state: SessionState;
  created_at: string;
  updated_at: string;
  description?: string;
  config?: Record<string, unknown>;
}

// ============================================================================
// Session Manager Errors
// ============================================================================

export class SessionError extends EventStreamError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, details);
    this.name = "SessionError";
  }
}

export class InvalidStateTransitionError extends SessionError {
  constructor(sessionId: string, from: SessionState, to: SessionState) {
    super(
      `Invalid state transition from ${from} to ${to} for session ${sessionId}`,
      "INVALID_STATE_TRANSITION",
      { sessionId, from, to },
    );
    this.name = "InvalidStateTransitionError";
  }
}

// ============================================================================
// Session Manager Interface
// ============================================================================

export interface ISessionManager {
  createSession(options?: {
    description?: string;
    config?: Record<string, unknown>;
  }): Session;

  pauseSession(sessionId: string): Session;
  resumeSession(sessionId: string): Session;
  completeSession(sessionId: string): Session;
  failSession(sessionId: string, error?: string): Session;
  cancelSession(sessionId: string): Session;
  getSession(sessionId: string): Session | undefined;
  getSessions(): Session[];
}

// ============================================================================
// Session Manager Implementation
// ============================================================================

/**
 * Session manager that coordinates session lifecycle with the event stream.
 *
 * Returns immutable copies of session objects to preserve event-sourcing invariants.
 */
export class SessionManager implements ISessionManager {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly eventStream: IEventStream) {}

  createSession(options?: {
    description?: string;
    config?: Record<string, unknown>;
  }): Session {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const session: Session = {
      id: sessionId,
      state: "active",
      created_at: now,
      updated_at: now,
      description: options?.description,
      config: options?.config,
    };

    this.sessions.set(sessionId, session);

    const payload: SessionCreatedPayload = {
      initial_state: "active",
      description: options?.description,
      config: options?.config,
    };

    this.eventStream.append({
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.SESSION_CREATED,
      payload,
      metadata: { source: "session-manager" },
    });

    return this.cloneSession(session);
  }

  pauseSession(sessionId: string): Session {
    return this.transition(sessionId, "paused", EventTypes.SESSION_PAUSED);
  }

  resumeSession(sessionId: string): Session {
    return this.transition(sessionId, "active", EventTypes.SESSION_RESUMED);
  }

  completeSession(sessionId: string): Session {
    return this.transition(sessionId, "completed", EventTypes.SESSION_COMPLETED);
  }

  failSession(sessionId: string, error?: string): Session {
    return this.transition(sessionId, "failed", EventTypes.SESSION_FAILED, {
      error,
    });
  }

  cancelSession(sessionId: string): Session {
    return this.transition(sessionId, "cancelled", EventTypes.SESSION_CANCELLED);
  }

  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);
    return session ? this.cloneSession(session) : undefined;
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values()).map((s) => this.cloneSession(s));
  }

  /**
   * Returns an immutable copy of a session.
   */
  private cloneSession(session: Session): Session {
    return { ...session };
  }

  private transition(
    sessionId: string,
    toState: SessionState,
    eventType: (typeof EventTypes)[keyof typeof EventTypes],
    additionalPayload?: Record<string, unknown>,
  ): Session {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new SessionError(
        `Session ${sessionId} not found`,
        "SESSION_NOT_FOUND",
        { sessionId },
      );
    }

    const validNextStates = VALID_TRANSITIONS[session.state];
    if (!validNextStates.has(toState)) {
      throw new InvalidStateTransitionError(sessionId, session.state, toState);
    }

    const previousState = session.state;
    session.state = toState;
    session.updated_at = new Date().toISOString();

    const currentSequence = this.eventStream.getCurrentSequence(sessionId);

    this.eventStream.append({
      session_id: sessionId,
      sequence_number: currentSequence + 1,
      event_type: eventType,
      payload: {
        previous_state: previousState,
        new_state: toState,
        ...additionalPayload,
      },
      metadata: { source: "session-manager" },
    });

    return this.cloneSession(session);
  }
}
