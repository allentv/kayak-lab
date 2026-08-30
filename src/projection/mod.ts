/**
 * Projection module for the kayak-lab agent interaction platform.
 *
 * Provides event projection protocol and UI surface implementations.
 */

export {
  ProjectionProtocol,
  type IProjectionProtocol,
  type SubscriptionId,
  type ProjectionState,
  type EventFilter,
  type SubscriptionOptions,
  type Subscription,
  type EventDeliveryCallback,
  type DeliveryErrorCallback,
} from "./protocol.ts";

export {
  TerminalProjection,
  StreamingDisplay,
  DefaultEventRenderer,
  type IEventRenderer,
  type InputHandler,
  type TerminalProjectionOptions,
  type TerminalStyle,
} from "./terminal.ts";
