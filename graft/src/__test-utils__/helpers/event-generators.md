# src/__test-utils__/helpers/event-generators.ts

- generateSessionEvent · function · L11-L27 — Creates a single test event with proper structure, unique ID, timestamp, and metadata for simulating real event data.
- generateEventSequence · function · L32-L46 — Generates a sequential series of events for a single session to test event ordering and processing logic.
- generateSessionLifecycleEvents · function · L51-L71 — Produces a complete session lifecycle with state transitions from creation through completion for testing session state management.
- generateMultipleSessions · function · L76-L94 — Creates multiple sessions each with their own event sequences to test multi-session scenarios and event aggregation.
