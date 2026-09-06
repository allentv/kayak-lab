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

export {
  VSCodeProjection,
  SessionTreeDataProvider,
  EventFormatter,
  VSCodeWebSocketClient,
  createVSCodeProjection,
  type IVSCodeProjection,
  type AgentState,
  type SessionTreeItem,
  type TreeItem,
  type IOutputChannel,
  type IStatusBarItem,
  type VSCodeWebSocketClientConfig,
  type VSCodeProjectionBundle,
  type ClientMessage,
  type ServerMessage,
} from "./vscode.ts";

export {
  WebProjection,
  WebRestApiClient,
  WebWebSocketClient,
  WebEventFormatter,
  createWebProjection,
  type IWebProjection,
  type WebSocketState,
  type SessionListItem,
  type EventLogItem,
  type UserInputResult,
  type EventDetail,
  type WebRestApiConfig,
  type WebWebSocketConfig,
  type WebProjectionBundle,
} from "./web.ts";

export {
  DesktopProjection,
  DesktopNotificationFormatter,
  createDesktopProjection,
  type IDesktopProjection,
  type DesktopNotification,
  type TrayMenuItem,
  type KeyboardShortcut,
  type DesktopProjectionState,
  type ISystemTray,
  type INotificationService,
  type IKeyboardShortcutService,
} from "./desktop.ts";

export {
  RestApiProjection,
  RestApiRouter,
  ApiKeyAuth,
  type ApiError,
  type SessionResponse,
  type EventListResponse,
  type MessageRequest,
  type MessageResponse,
  type RouteHandler,
  type ApiRoute,
  type RestApiConfig,
} from "./rest-api.ts";
