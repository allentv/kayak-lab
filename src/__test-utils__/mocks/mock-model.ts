/**
 * Mock Model provider for testing.
 *
 * Configurable responses, streaming, error simulation.
 */

import type {
  IModelProvider,
  ModelRequest,
  ModelResponse,
  StreamDelta,
} from "../../runtime/model-provider.ts";

export interface MockModelProviderConfig {
  responses?: ModelResponse[];
  streamDeltas?: StreamDelta[];
  shouldFail?: boolean;
  failMessage?: string;
  responseDelay?: number;
}

export class MockModelProvider implements IModelProvider {
  readonly name: string;
  private config: MockModelProviderConfig;
  private responseIndex = 0;

  // Call tracking
  public invokeCount = 0;
  public streamCount = 0;
  public requests: ModelRequest[] = [];

  constructor(
    name = "mock-model",
    config: MockModelProviderConfig = {},
  ) {
    this.name = name;
    this.config = config;
  }

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    this.invokeCount++;
    this.requests.push(request);

    if (this.config.responseDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.responseDelay)
      );
    }

    if (this.config.shouldFail) {
      throw new Error(this.config.failMessage ?? `${this.name} failed`);
    }

    const responses = this.config.responses ?? [
      {
        content: "Mock response",
        tool_calls: [],
        finish_reason: "stop" as const,
      },
    ];

    const response = responses[this.responseIndex % responses.length];
    this.responseIndex++;
    return response;
  }

  async *stream(request: ModelRequest): AsyncIterable<StreamDelta> {
    this.streamCount++;
    this.requests.push(request);

    if (this.config.shouldFail) {
      throw new Error(this.config.failMessage ?? `${this.name} failed`);
    }

    const deltas = this.config.streamDeltas ?? [
      { content: "Mock ", finish_reason: undefined },
      { content: "response", finish_reason: "stop" },
    ];

    for (const delta of deltas) {
      yield delta;
    }
  }

  reset(): void {
    this.invokeCount = 0;
    this.streamCount = 0;
    this.requests = [];
    this.responseIndex = 0;
  }
}
