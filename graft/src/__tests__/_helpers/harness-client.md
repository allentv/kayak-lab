# src/__tests__/_helpers/harness-client.ts · [[test-utilities]]

Blackbox E2E test helper providing a typed HTTP client for interacting with a running harness server API.

- HealthResponse · interface · L12-L17 — Represents the health status response from the harness server including uptime and session/event counts.
- SessionSummary · interface · L19-L26 — Provides a summary view of a session with its ID, state, timestamps, and event count for listing operations.
- SessionDetail · interface · L28-L30 — Extends SessionSummary to include the full list of events for detailed session inspection.
- EventRecord · interface · L32-L39 — Represents an individual event within a session with its type, sequence, payload, and metadata.
- CapabilitySummary · interface · L41-L45 — Describes a capability available on the harness server including its name, version, and initialization status.
- CorsHeaders · interface · L47-L50 — Captures CORS preflight response status and headers for cross-origin request testing.
- HarnessClient · class · L56-L166 — HTTP client class that provides typed methods for all harness API endpoints used in blackbox E2E testing.
- constructor · method · L57-L57 — Initializes the client with the base URL of the running harness server to target.
- getHealth · method · L61-L67 — Checks the health status of the harness server to verify it's running and ready for testing.
- createSession · method · L71-L83 — Creates a new session on the harness server with an optional description for test organization.
- patchSession · method · L85-L100 — Updates a session's state by applying an action (like transition) with optional error information.
- getSessions · method · L102-L108 — Retrieves a list of all sessions from the harness server for test verification and state inspection.
- getSession · method · L110-L119 — Fetches detailed information about a specific session including all its events for comprehensive testing.
- getSessionEvents · method · L121-L136 — Retrieves events from a session with optional filtering by type and limiting for focused test scenarios.
- getCapabilities · method · L140-L146 — Lists all capabilities available on the harness server to verify feature availability during tests.
- options · method · L150-L165 — Performs CORS preflight requests to test cross-origin resource sharing configuration of the harness.
- HttpError · class · L172-L180 — Custom error class that extends Error with HTTP status code for standardized API error handling in tests.
- constructor · method · L173-L179 — Creates an HTTP error instance with status code and message for consistent error reporting in tests.
