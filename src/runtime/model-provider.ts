/**
 * Model abstraction layer.
 *
 * Provider-agnostic interface for invoking LLM models.
 * Supports multiple providers with fallback and streaming.
 */

// ============================================================================
// Model Types
// ============================================================================

/** Model message role. */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/** A single message in the conversation. */
export interface Message {
  role: MessageRole;
  content: string;
  /** Tool call ID for tool result messages. */
  tool_call_id?: string;
}

/** Tool definition for model invocation. */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Model invocation request. */
export interface ModelRequest {
  messages: Message[];
  tools?: ToolDefinition[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/** Tool call from model response. */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** Model invocation response. */
export interface ModelResponse {
  content: string | null;
  tool_calls: ToolCall[];
  finish_reason: "stop" | "tool_calls" | "length";
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Streaming delta from model. */
export interface StreamDelta {
  content?: string;
  tool_calls?: Partial<ToolCall>[];
  finish_reason?: "stop" | "tool_calls" | "length";
}

/** Model provider configuration. */
export interface ModelProviderConfig {
  name: string;
  api_key?: string;
  base_url?: string;
  default_model?: string;
}

// ============================================================================
// Model Provider Interface
// ============================================================================

/**
 * Interface that model providers must implement.
 */
export interface IModelProvider {
  /** Provider name. */
  readonly name: string;

  /** Invoke model with request. */
  invoke(request: ModelRequest): Promise<ModelResponse>;

  /** Invoke model with streaming. */
  stream(request: ModelRequest): AsyncIterable<StreamDelta>;
}

// ============================================================================
// Model Provider Errors
// ============================================================================

export class ModelError extends Error {
  public readonly provider?: string;
  override readonly cause?: Error;

  constructor(
    message: string,
    provider?: string,
    cause?: Error,
  ) {
    super(message);
    this.name = "ModelError";
    this.provider = provider;
    this.cause = cause;
  }
}

export class ProviderNotFoundError extends ModelError {
  constructor(provider: string) {
    super(`Provider not found: ${provider}`);
    this.name = "ProviderNotFoundError";
  }
}

export class ModelTimeoutError extends ModelError {
  constructor(provider: string, timeoutMs: number) {
    super(`Model invocation timed out after ${timeoutMs}ms`, provider);
    this.name = "ModelTimeoutError";
  }
}

// ============================================================================
// Model Abstraction Implementation
// ============================================================================

/**
 * Manages multiple model providers and routes requests.
 */
export class ModelManager {
  private providers: Map<string, IModelProvider> = new Map();
  private defaultProvider?: string;
  private fallbackProviders: string[] = [];

  /**
   * Register a model provider.
   */
  register(provider: IModelProvider): void {
    this.providers.set(provider.name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
  }

  /**
   * Set the default provider.
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new ProviderNotFoundError(name);
    }
    this.defaultProvider = name;
  }

  /**
   * Set fallback providers in order of preference.
   */
  setFallbackProviders(names: string[]): void {
    for (const name of names) {
      if (!this.providers.has(name)) {
        throw new ProviderNotFoundError(name);
      }
    }
    this.fallbackProviders = names;
  }

  /**
   * Get provider by name.
   */
  getProvider(name?: string): IModelProvider {
    const providerName = name || this.defaultProvider;
    if (!providerName) {
      throw new ModelError("No provider configured");
    }
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new ProviderNotFoundError(providerName);
    }
    return provider;
  }

  /**
   * Invoke model with automatic fallback.
   */
  async invoke(
    request: ModelRequest,
    providerName?: string,
  ): Promise<ModelResponse> {
    const providers = this.getProviderChain(providerName);
    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        return await provider.invoke(request);
      } catch (error) {
        lastError = error as Error;
        // Continue to next provider
      }
    }

    throw new ModelError(
      `All providers failed`,
      undefined,
      lastError,
    );
  }

  /**
   * Invoke model with streaming and automatic fallback.
   */
  async *stream(
    request: ModelRequest,
    providerName?: string,
  ): AsyncIterable<StreamDelta> {
    const providers = this.getProviderChain(providerName);
    let lastError: Error | undefined;

    for (const provider of providers) {
      try {
        yield* provider.stream(request);
        return;
      } catch (error) {
        lastError = error as Error;
        // Continue to next provider
      }
    }

    throw new ModelError(
      `All providers failed`,
      undefined,
      lastError,
    );
  }

  /**
   * Get ordered list of providers to try.
   */
  private *getProviderChain(
    preferred?: string,
  ): Generator<IModelProvider> {
    // Try preferred provider first
    if (preferred) {
      const provider = this.providers.get(preferred);
      if (provider) {
        yield provider;
      }
    }

    // Try default provider if not already tried
    if (this.defaultProvider && this.defaultProvider !== preferred) {
      const provider = this.providers.get(this.defaultProvider);
      if (provider) {
        yield provider;
      }
    }

    // Try fallback providers
    for (const name of this.fallbackProviders) {
      if (name !== preferred && name !== this.defaultProvider) {
        const provider = this.providers.get(name);
        if (provider) {
          yield provider;
        }
      }
    }
  }
}
