/**
 * Mock registry - re-exports all test mocks.
 */

export { MockGitCapability } from "./mock-git.ts";
export type { MockGitCapabilityConfig } from "./mock-git.ts";

export { MockGitHubCapability } from "./mock-github.ts";
export type { MockGitHubCapabilityConfig } from "./mock-github.ts";

export { MockShellCapability } from "./mock-shell.ts";
export type { MockShellCapabilityConfig } from "./mock-shell.ts";

export { MockModelProvider } from "./mock-model.ts";
export type { MockModelProviderConfig } from "./mock-model.ts";

export { MockEventStore } from "./mock-event-store.ts";
export type { MockEventStoreConfig } from "./mock-event-store.ts";
