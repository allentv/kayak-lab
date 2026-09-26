# src/__test-utils__/helpers/assertions.ts

- assertEventEquals · function · L12-L37 — Verifies that two events are equal while ignoring auto-generated fields and always checking that auto-generated fields exist.
- assertCapabilitySuccess · function · L42-L50 — Asserts that a capability result is successful and optionally matches expected data.
- assertCapabilityFailure · function · L55-L65 — Asserts that a capability result is a failure and optionally contains an expected error message.
- assertEventsInOrder · function · L70-L79 — Verifies that events are in correct chronological order by checking that each sequence number is greater than the previous.
- assertSameSession · function · L84-L95 — Ensures all events belong to the same session by comparing their session IDs against the first event's session ID.
