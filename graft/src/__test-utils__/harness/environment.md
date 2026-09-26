# src/__test-utils__/harness/environment.ts

- TestEnvironment · interface · L19-L55 — Interface defining a complete test environment with all core components needed for integration testing of agent runtime systems.
- TestEnvironmentConfig · interface · L57-L66 — Configuration interface for customizing test environments with model responses, agent settings, and provider overrides.
- createTestEnvironment · function · L71-L153 — Factory function that creates a fully wired test environment with mock model providers, event streams, and agent runtime factories for integration testing.
- createAgent · function · L97-L115 — Factory function that creates an AgentRuntime instance with optional configuration and model provider overrides for testing different agent setups.
- getRuntime · function · L117-L122 — Lazy initialization function that provides a default agent runtime instance, creating one if none exists yet.
- runInteraction · function · L124-L129 — Convenience function that starts an agent, processes an input message, and returns the response for quick interaction testing.
- getEventStore · function · L131-L131 — Simple getter function that returns the event store instance from the test environment.
- dispose · function · L133-L138 — Cleanup function that stops the current agent runtime and releases resources to prevent memory leaks between tests.
