# src/__test-utils__/helpers/session-builder.ts

Provides a fluent builder API for creating test sessions with events to simulate user interactions in testing scenarios.

- TestSession · interface · L10-L13 — Represents a test session containing an ID and a sequence of events for simulating user behavior in tests.
- TestSessionBuilder · interface · L15-L34 — Defines a fluent interface for constructing test sessions by setting IDs and adding events in sequence.
- TestSessionBuilderImpl · class · L36-L85 — Implements the test session builder with internal state management for session ID, events, and sequence numbers.
- constructor · method · L41-L43 — Initializes a test session builder with either a provided session ID or a randomly generated one.
- withId · method · L45-L48 — Sets a custom session ID for the test session being built.
- addEvent · method · L50-L67 — Adds a single event to the session with automatic UUID generation, timestamping, and sequence number management.
- addEventSequence · method · L69-L77 — Adds multiple events in sequence to the session, optionally with corresponding payloads for each event.
- build · method · L79-L84 — Finalizes the builder and returns the completed test session with all accumulated events.
- createTestSession · function · L99-L101 — Factory function that creates a new test session builder instance for fluent session construction.
- createDefaultTestSession · function · L106-L124 — Creates a ready-to-use test session with a standard sequence of events representing a typical session lifecycle.
