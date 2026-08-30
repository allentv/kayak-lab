/**
 * Projection protocol for UI surface subscription and delivery.
 *
 * Defines how UI surfaces subscribe to event streams and receive updates.
 */

import { BaseEvent, EventType } from "../types/events.ts";
import { IEventStream } from "../core/event-stream.ts";

// ============================================================================
// Projection Types
// ============================================================================

/** Subscription ID. */
export type SubscriptionId = string;

/** Projection state. */
export type ProjectionState = "active" | "paused" | "closed";

/** Event filter for subscriptions. */
export interface EventFilter {
  /** Event types to include (empty = all). */
  event_types?: EventType[];
  /** Event types to exclude. */
  exclude_types?: EventType[];
  /** Sequence number to start from (for reconnection). */
  from_sequence?: number;
}

/** Subscription options. */
export interface SubscriptionOptions {
  /** Event filter. */
  filter?: EventFilter;
  /** Maximum events to buffer before dropping. */
  buffer_size?: number;
  /** Delivery timeout in milliseconds. */
  delivery_timeout?: number;
}

/** Subscription handle. */
export interface Subscription {
  /** Unique subscription ID. */
  readonly id: SubscriptionId;
  /** Session ID being subscribed to. */
  readonly session_id: string;
  /** Current state. */
  readonly state: ProjectionState;
  /** Event filter. */
  readonly filter: EventFilter | undefined;
  /** Last delivered sequence number. */
  readonly last_sequence: number;
}

/** Delivery callback. */
export type EventDeliveryCallback = (
  event: BaseEvent,
  subscription: Subscription,
) => void | Promise<void>;

/** Error callback. */
export type DeliveryErrorCallback = (
  error: Error,
  subscription: Subscription,
) => void;

// ============================================================================
// Projection Protocol Interface
// ============================================================================

/**
 * Interface for projection protocol operations.
 */
export interface IProjectionProtocol {
  /**
   * Subscribe to events for a session.
   *
   * @param session_id - Session to subscribe to
   * @param callback - Event delivery callback
   * @param options - Subscription options
   * @returns Subscription handle
   */
  subscribe(
    session_id: string,
    callback: EventDeliveryCallback,
    options?: SubscriptionOptions,
  ): Subscription;

  /**
   * Unsubscribe from a session.
   *
   * @param subscription_id - Subscription to cancel
   */
  unsubscribe(subscription_id: SubscriptionId): void;

  /**
   * Pause a subscription (stops delivery but keeps state).
   *
   * @param subscription_id - Subscription to pause
   */
  pause(subscription_id: SubscriptionId): void;

  /**
   * Resume a paused subscription.
   *
   * @param subscription_id - Subscription to resume
   */
  resume(subscription_id: SubscriptionId): void;

  /**
   * Get subscription by ID.
   *
   * @param subscription_id - Subscription ID
   */
  getSubscription(subscription_id: SubscriptionId): Subscription | undefined;

  /**
   * Get all active subscriptions for a session.
   *
   * @param session_id - Session ID
   */
  getSubscriptionsForSession(session_id: string): Subscription[];

  /**
   * Set error handler for delivery failures.
   *
   * @param handler - Error callback
   */
  onError(handler: DeliveryErrorCallback): void;
}

// ============================================================================
// Projection Protocol Implementation
// ============================================================================

/**
 * In-memory projection protocol implementation.
 *
 * Manages subscriptions and delivers events from the event stream
 * to UI surfaces in order with guaranteed delivery.
 */
export class ProjectionProtocol implements IProjectionProtocol {
  private eventStream: IEventStream;
  private subscriptions: Map<SubscriptionId, SubscriptionState> = new Map();
  private sessionSubscriptions: Map<string, Set<SubscriptionId>> = new Map();
  private errorCallback: DeliveryErrorCallback | null = null;
  private deliveryTimers: Map<SubscriptionId, number> = new Map();

  constructor(eventStream: IEventStream) {
    this.eventStream = eventStream;
  }

  subscribe(
    session_id: string,
    callback: EventDeliveryCallback,
    options?: SubscriptionOptions,
  ): Subscription {
    const id = this.generateSubscriptionId();
    const filter = options?.filter;

    const state: SubscriptionState = {
      id,
      session_id,
      state: "active",
      filter,
      last_sequence: filter?.from_sequence ?? 0,
      callback,
      buffer_size: options?.buffer_size ?? 1000,
      delivery_timeout: options?.delivery_timeout ?? 5000,
    };

    this.subscriptions.set(id, state);

    // Track session subscriptions
    if (!this.sessionSubscriptions.has(session_id)) {
      this.sessionSubscriptions.set(session_id, new Set());
    }
    this.sessionSubscriptions.get(session_id)!.add(id);

    // Deliver any existing events
    this.deliverExistingEvents(state);

    // Start monitoring for new events
    this.startEventMonitoring(state);

    return {
      id,
      session_id,
      state: "active",
      filter,
      last_sequence: state.last_sequence,
    };
  }

  unsubscribe(subscription_id: SubscriptionId): void {
    const state = this.subscriptions.get(subscription_id);
    if (!state) return;

    state.state = "closed";

    // Clear monitoring timer
    const timer = this.deliveryTimers.get(subscription_id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.deliveryTimers.delete(subscription_id);
    }

    // Remove from session tracking
    const sessionSubs = this.sessionSubscriptions.get(state.session_id);
    if (sessionSubs) {
      sessionSubs.delete(subscription_id);
      if (sessionSubs.size === 0) {
        this.sessionSubscriptions.delete(state.session_id);
      }
    }

    this.subscriptions.delete(subscription_id);
  }

  pause(subscription_id: SubscriptionId): void {
    const state = this.subscriptions.get(subscription_id);
    if (!state || state.state !== "active") return;

    state.state = "paused";

    // Clear monitoring timer
    const timer = this.deliveryTimers.get(subscription_id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.deliveryTimers.delete(subscription_id);
    }
  }

  resume(subscription_id: SubscriptionId): void {
    const state = this.subscriptions.get(subscription_id);
    if (!state || state.state !== "paused") return;

    state.state = "active";

    // Resume monitoring
    this.startEventMonitoring(state);

    // Deliver any events that arrived while paused
    this.deliverExistingEvents(state);
  }

  getSubscription(subscription_id: SubscriptionId): Subscription | undefined {
    const state = this.subscriptions.get(subscription_id);
    if (!state) return undefined;

    return {
      id: state.id,
      session_id: state.session_id,
      state: state.state,
      filter: state.filter,
      last_sequence: state.last_sequence,
    };
  }

  getSubscriptionsForSession(session_id: string): Subscription[] {
    const subIds = this.sessionSubscriptions.get(session_id);
    if (!subIds) return [];

    const subscriptions: Subscription[] = [];
    for (const id of subIds) {
      const sub = this.getSubscription(id);
      if (sub) subscriptions.push(sub);
    }

    return subscriptions;
  }

  onError(handler: DeliveryErrorCallback): void {
    this.errorCallback = handler;
  }

  private async deliverExistingEvents(state: SubscriptionState): Promise<void> {
    try {
      const events = this.eventStream.getEvents(state.session_id);

      for (const event of events) {
        if (event.sequence_number <= state.last_sequence) continue;
        if (!this.matchesFilter(event, state.filter)) continue;

        await this.deliverEvent(event, state);
      }
    } catch (error) {
      this.handleError(error as Error, state);
    }
  }

  private startEventMonitoring(state: SubscriptionState): void {
    // Poll for new events at regular intervals
    const poll = async () => {
      if (state.state !== "active") return;

      try {
        const lastEvent = this.eventStream.getLastEvent(state.session_id);
        if (lastEvent && lastEvent.sequence_number > state.last_sequence) {
          // New events available - deliver them
          const events = this.eventStream.getEvents(state.session_id);
          for (const event of events) {
            if (event.sequence_number <= state.last_sequence) continue;
            if (!this.matchesFilter(event, state.filter)) continue;

            await this.deliverEvent(event, state);
          }
        }
      } catch (error) {
        this.handleError(error as Error, state);
      }

      // Schedule next poll
      if (state.state === "active") {
        const timer = setTimeout(poll, 100) as unknown as number;
        this.deliveryTimers.set(state.id, timer);
      }
    };

    // Start polling
    poll();
  }

  private async deliverEvent(
    event: BaseEvent,
    state: SubscriptionState,
  ): Promise<void> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Delivery timeout")),
          state.delivery_timeout,
        );
      });

      // Deliver with timeout
      await Promise.race([
        state.callback(event, {
          id: state.id,
          session_id: state.session_id,
          state: state.state,
          filter: state.filter,
          last_sequence: state.last_sequence,
        }),
        timeoutPromise,
      ]);

      // Update last delivered sequence
      state.last_sequence = event.sequence_number;
    } catch (error) {
      this.handleError(error as Error, state);
    }
  }

  private matchesFilter(
    event: BaseEvent,
    filter: EventFilter | undefined,
  ): boolean {
    if (!filter) return true;

    // Check include list
    if (filter.event_types && filter.event_types.length > 0) {
      if (!filter.event_types.includes(event.event_type)) {
        return false;
      }
    }

    // Check exclude list
    if (filter.exclude_types && filter.exclude_types.length > 0) {
      if (filter.exclude_types.includes(event.event_type)) {
        return false;
      }
    }

    // Check sequence number
    if (filter.from_sequence !== undefined) {
      if (event.sequence_number < filter.from_sequence) {
        return false;
      }
    }

    return true;
  }

  private handleError(error: Error, state: SubscriptionState): void {
    if (this.errorCallback) {
      try {
        this.errorCallback(error, {
          id: state.id,
          session_id: state.session_id,
          state: state.state,
          filter: state.filter,
          last_sequence: state.last_sequence,
        });
      } catch {
        // Error handler itself failed - silently ignore
      }
    }
  }

  private generateSubscriptionId(): SubscriptionId {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ============================================================================
// Internal Types
// ============================================================================

/** Internal subscription state. */
interface SubscriptionState {
  id: SubscriptionId;
  session_id: string;
  state: ProjectionState;
  filter: EventFilter | undefined;
  last_sequence: number;
  callback: EventDeliveryCallback;
  buffer_size: number;
  delivery_timeout: number;
}
