# src/__tests__/_helpers/harness-process.ts · [[test-utilities]]

Blackbox E2E test helper that manages a harness server subprocess for testing by starting it on a random port, waiting for readiness, and providing clean teardown.

- HarnessProcess · interface · L11-L15 — Interface representing a running harness server process with its port, URL, and a method to stop it cleanly.
- findFreePort · function · L20-L39 — Finds an available port in the ephemeral range (30000-40000) by randomly selecting ports and testing if they can be bound.
- startHarness · function · L44-L75 — Starts the harness server as a subprocess on a specified or random port and returns a managed process object after confirming server readiness.
- stop · method · L62-L73 — Gracefully stops the harness subprocess by sending SIGTERM and waiting for its termination.
- waitForReady · function · L80-L102 — Polls the server's health endpoint with exponential backoff until it responds successfully, ensuring the harness is ready for testing.
