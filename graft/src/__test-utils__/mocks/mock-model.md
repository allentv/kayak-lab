# src/__test-utils__/mocks/mock-model.ts

- MockModelProviderConfig · interface · L14-L20 — Configuration interface for controlling mock model behavior including response data, streaming deltas, failure simulation, and timing delays.
- MockModelProvider · class · L22-L91 — Test implementation of a model provider that tracks calls, cycles through configured responses, and simulates various API behaviors for unit testing.
- constructor · method · L32-L38 — Initializes the mock provider with a name and configuration for controlling its test behavior.
- invoke · method · L40-L65 — Simulates a synchronous model API call by tracking requests, applying delays, throwing configured errors, or returning mock responses in rotation.
- stream · method · L67-L83 — Simulates a streaming model API by yielding configured delta chunks or throwing errors, while tracking stream calls for test verification.
- reset · method · L85-L90 — Clears all tracking counters and stored requests to restore the mock to a fresh state between test cases.
