/**
 * Capability abstraction layer.
 *
 * Abstract interfaces for tool capabilities with typed parameters and results.
 * Capabilities provide typed access to external systems.
 */

// ============================================================================
// Capability Types
// ============================================================================

/** Capability definition for registration. */
export interface CapabilityDefinition {
  name: string;
  description: string;
  version: string;
}

/** Capability execution context. */
export interface CapabilityContext {
  session_id: string;
  working_directory?: string;
  environment?: Record<string, string>;
}

/** Capability execution result. */
export interface CapabilityResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Capability Interface
// ============================================================================

/**
 * Base interface that all capabilities must implement.
 */
export interface ICapability {
  /** Capability definition. */
  readonly definition: CapabilityDefinition;

  /** Initialize the capability. */
  initialize(context: CapabilityContext): Promise<void>;

  /** Cleanup the capability. */
  dispose(): Promise<void>;
}

// ============================================================================
// Capability Errors
// ============================================================================

export class CapabilityError extends Error {
  constructor(
    message: string,
    public readonly capability: string,
    override readonly cause?: Error,
  ) {
    super(message);
    this.name = "CapabilityError";
  }
}

export class CapabilityNotInitializedError extends CapabilityError {
  constructor(capability: string) {
    super(`Capability not initialized: ${capability}`, capability);
    this.name = "CapabilityNotInitializedError";
  }
}

export class CapabilityExecutionError extends CapabilityError {
  constructor(
    capability: string,
    operation: string,
    cause?: Error,
  ) {
    super(`Capability execution failed: ${operation}`, capability, cause);
    this.name = "CapabilityExecutionError";
  }
}

// ============================================================================
// Capability Registry
// ============================================================================

/**
 * Registry for capability implementations.
 */
export class CapabilityRegistry {
  private capabilities: Map<string, ICapability> = new Map();
  private initialized: Set<string> = new Set();

  /**
   * Register a capability.
   */
  register(capability: ICapability): void {
    this.capabilities.set(capability.definition.name, capability);
  }

  /**
   * Unregister a capability.
   */
  unregister(name: string): boolean {
    this.initialized.delete(name);
    return this.capabilities.delete(name);
  }

  /**
   * Get a capability by name.
   */
  get(name: string): ICapability | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Get all registered capabilities.
   */
  getAll(): ICapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Initialize all capabilities.
   */
  async initializeAll(context: CapabilityContext): Promise<void> {
    for (const [name, capability] of this.capabilities) {
      if (!this.initialized.has(name)) {
        await capability.initialize(context);
        this.initialized.add(name);
      }
    }
  }

  /**
   * Dispose all capabilities.
   */
  async disposeAll(): Promise<void> {
    for (const [name, capability] of this.capabilities) {
      if (this.initialized.has(name)) {
        await capability.dispose();
        this.initialized.delete(name);
      }
    }
  }

  /**
   * Check if a capability is initialized.
   */
  isInitialized(name: string): boolean {
    return this.initialized.has(name);
  }
}
