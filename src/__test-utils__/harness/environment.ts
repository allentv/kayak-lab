/**
 * Test environment harness for integration testing.
 *
 * Creates a fully wired test environment with mock capabilities
 * and in-memory store.
 */

import { EventStream } from "../../core/event-stream.ts";
import { SessionManager } from "../../core/session-manager.ts";
import { EventStore } from "../../store/event-store.ts";
import { ModelManager } from "../../runtime/model-provider.ts";
import { ToolRegistry } from "../../runtime/tool-registry.ts";
import { AgentRuntime } from "../../runtime/agent-runtime.ts";
import { MockModelProvider } from "../mocks/mock-model.ts";
import { MockEventStore } from "../mocks/mock-event-store.ts";
import type { IModelProvider, ModelResponse } from "../../runtime/model-provider.ts";
import type { AgentConfig } from "../../runtime/agent-runtime.ts";

export interface TestEnvironment {
  /** Core event stream. */
  eventStream: EventStream;

  /** Session manager. */
  sessionManager: SessionManager;

  /** Event store (real in-memory). */
  eventStore: EventStore;

  /** Mock event store for capture. */
  mockEventStore: MockEventStore;

  /** Model manager with mock provider. */
  modelManager: ModelManager;

  /** Tool registry. */
  toolRegistry: ToolRegistry;

  /** Agent runtime factory. */
  createAgent: (
    config?: AgentConfig,
    provider?: IModelProvider,
  ) => AgentRuntime;

  /** Quick access to runtime with default mock. */
  getRuntime: () => AgentRuntime;

  /** Run a quick interaction and return the response. */
  runInteraction: (message: string) => Promise<string>;

  /** Get the event store. */
  getEventStore: () => EventStore;

  /** Cleanup resources. */
  dispose: () => Promise<void>;
}

export interface TestEnvironmentConfig {
  /** Custom model responses. */
  modelResponses?: ModelResponse[];

  /** Agent configuration. */
  agentConfig?: AgentConfig;

  /** Custom model provider. */
  provider?: IModelProvider;
}

/**
 * Creates a fully wired test environment.
 */
export function createTestEnvironment(
  config: TestEnvironmentConfig = {},
): TestEnvironment {
  const eventStream = new EventStream();
  const sessionManager = new SessionManager(eventStream);
  const eventStore = new EventStore();
  const mockEventStore = new MockEventStore();
  const modelManager = new ModelManager();
  const toolRegistry = new ToolRegistry();

  // Set up default mock model provider
  const defaultProvider = config.provider ??
    new MockModelProvider("test-model", {
      responses: config.modelResponses ?? [
        {
          content: "Test response",
          tool_calls: [],
          finish_reason: "stop",
        },
      ],
    });
  modelManager.register(defaultProvider);
  modelManager.setDefaultProvider(defaultProvider.name);

  let currentAgent: AgentRuntime | null = null;

  const createAgent = (
    agentConfig?: AgentConfig,
    provider?: IModelProvider,
  ): AgentRuntime => {
    if (provider) {
      modelManager.register(provider);
      modelManager.setDefaultProvider(provider.name);
    }

    const agent = new AgentRuntime(
      eventStream,
      sessionManager,
      modelManager,
      toolRegistry,
      agentConfig ?? config.agentConfig ?? {},
    );
    currentAgent = agent;
    return agent;
  };

  const getRuntime = (): AgentRuntime => {
    if (!currentAgent) {
      currentAgent = createAgent();
    }
    return currentAgent;
  };

  const runInteraction = async (message: string): Promise<string> => {
    const agent = getRuntime();
    await agent.start();
    const response = await agent.processInput(message);
    return response;
  };

  const getEventStore = (): EventStore => eventStore;

  const dispose = async (): Promise<void> => {
    if (currentAgent) {
      await currentAgent.stop();
      currentAgent = null;
    }
  };

  return {
    eventStream,
    sessionManager,
    eventStore,
    mockEventStore,
    modelManager,
    toolRegistry,
    createAgent,
    getRuntime,
    runInteraction,
    getEventStore,
    dispose,
  };
}
