# src/projection/__tests__/web.test.ts · [[projection-system]]

Unit tests for Web projection components including WebProjection and WebEventFormatter.

- MockRestApiClient · class · L17-L45 — Mock implementation of a REST API client for testing WebProjection's session and event management.
- getSessions · method · L22-L24 — Returns the mock sessions array for testing session loading functionality.
- createSession · method · L26-L35 — Creates a mock session with a timestamp-based ID and adds it to the sessions array for testing session creation.
- getEvents · method · L37-L39 — Returns a slice of mock events for testing event pagination and retrieval.
- sendMessage · method · L41-L44 — Records a message in the mock messages array for testing message sending functionality.
- createTestEvent · function · L51-L65 — Creates a standardized test event with random UUID and default values for testing event formatting.
