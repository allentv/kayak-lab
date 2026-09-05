/**
 * Tool definition with JSON Schema parameter validation.
 *
 * Validates tool definitions against a schema and provides
 * runtime parameter validation following OpenAI's function calling pattern.
 */

import type { IToolDefinition, ParameterProperty, ParameterSchema } from "./types.ts";

// ============================================================================
// Validation Errors
// ============================================================================

export class ToolDefinitionError extends Error {
  constructor(
    message: string,
    public readonly toolName?: string,
  ) {
    super(message);
    this.name = "ToolDefinitionError";
  }
}

export class ParameterValidationError extends ToolDefinitionError {
  public readonly errors: string[];

  constructor(
    toolName: string,
    errors: string[],
  ) {
    super(`Parameter validation failed for tool '${toolName}': ${errors.join("; ")}`, toolName);
    this.name = "ParameterValidationError";
    this.errors = errors;
  }
}

// ============================================================================
// Tool Definition Class
// ============================================================================

/**
 * Immutable tool definition with validation.
 *
 * Validates that a tool definition has all required fields and that
 * parameters match the JSON Schema format.
 */
export class ToolDefinition {
  private readonly _definition: Readonly<IToolDefinition>;

  private constructor(definition: IToolDefinition) {
    this._definition = Object.freeze({ ...definition });
  }

  /**
   * Create a validated tool definition.
   *
   * @throws {ToolDefinitionError} if the definition is invalid.
   */
  static create(definition: IToolDefinition): ToolDefinition {
    const errors = ToolDefinition.validate(definition);
    if (errors.length > 0) {
      throw new ToolDefinitionError(
        `Invalid tool definition '${definition.name}': ${errors.join("; ")}`,
        definition.name,
      );
    }
    return new ToolDefinition(definition);
  }

  /**
   * Validate a tool definition without throwing.
   * Returns an array of error messages (empty = valid).
   */
  static validate(definition: IToolDefinition): string[] {
    const errors: string[] = [];

    if (!definition.name || typeof definition.name !== "string") {
      errors.push("name is required and must be a string");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(definition.name)) {
      errors.push("name must contain only alphanumeric characters, underscores, and hyphens");
    }

    if (!definition.description || typeof definition.description !== "string") {
      errors.push("description is required and must be a string");
    }

    if (!definition.parameters) {
      errors.push("parameters is required");
    } else {
      const paramErrors = ToolDefinition.validateParameters(definition.parameters);
      errors.push(...paramErrors);
    }

    return errors;
  }

  /**
   * Validate a parameter schema.
   */
  private static validateParameters(params: ParameterSchema): string[] {
    const errors: string[] = [];

    if (typeof params !== "object" || params === null) {
      return ["parameters must be an object"];
    }

    if (params.type !== "object") {
      errors.push("parameters.type must be 'object'");
    }

    if (params.properties) {
      for (const [key, prop] of Object.entries(params.properties)) {
        if (typeof prop !== "object" || prop === null) {
          errors.push(`parameter '${key}' must be an object`);
          continue;
        }
        if (!prop.type || typeof prop.type !== "string") {
          errors.push(`parameter '${key}' must have a type`);
        }
      }
    }

    if (params.required) {
      if (!Array.isArray(params.required)) {
        errors.push("parameters.required must be an array");
      } else {
        for (const name of params.required) {
          if (typeof name !== "string") {
            errors.push("each required parameter must be a string");
          } else if (params.properties && !(name in params.properties)) {
            errors.push(`required parameter '${name}' is not defined in properties`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate tool call parameters against this definition's schema.
   *
   * @throws {ParameterValidationError} if parameters are invalid.
   */
  validateParameters(params: Record<string, unknown>): void {
    const errors: string[] = [];
    const schema = this._definition.parameters;

    // Check required parameters
    if (schema.required) {
      for (const name of schema.required) {
        if (!(name in params)) {
          errors.push(`missing required parameter '${name}'`);
        }
      }
    }

    // Validate each provided parameter
    if (schema.properties) {
      for (const [key, value] of Object.entries(params)) {
        const propSchema = schema.properties[key];
        if (!propSchema) {
          // Allow extra parameters (OpenAI pattern allows this)
          continue;
        }

        const propErrors = this.validateProperty(key, value, propSchema);
        errors.push(...propErrors);
      }
    }

    if (errors.length > 0) {
      throw new ParameterValidationError(this._definition.name, errors);
    }
  }

  /**
   * Validate a single parameter value against its schema.
   */
  private validateProperty(
    name: string,
    value: unknown,
    schema: ParameterProperty,
  ): string[] {
    const errors: string[] = [];

    // Type check
    if (!this.matchType(value, schema.type)) {
      errors.push(`parameter '${name}' expected type '${schema.type}', got '${typeof value}'`);
      return errors;
    }

    // Enum check
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`parameter '${name}' must be one of: ${schema.enum.join(", ")}`);
    }

    // Nested object validation
    if (schema.type === "object" && schema.properties && typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          errors.push(...this.validateProperty(key, obj[key], propSchema));
        }
      }
      if (schema.required) {
        for (const req of schema.required) {
          if (!(req in obj)) {
            errors.push(`parameter '${name}' is missing required field '${req}'`);
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check if a value matches a JSON Schema type.
   */
  private matchType(value: unknown, type: string): boolean {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return typeof value === "object" && value !== null && !Array.isArray(value);
      case "array":
        return Array.isArray(value);
      case "null":
        return value === null;
      default:
        return true; // Unknown type, allow
    }
  }

  /** Get the immutable definition. */
  get definition(): Readonly<IToolDefinition> {
    return this._definition;
  }

  /** Tool name — stable domain identifier. */
  get name(): string {
    return this._definition.name;
  }

  /**
   * Convert to JSON-serializable format (for model invocation).
   */
  toJSON(): IToolDefinition {
    return { ...this._definition };
  }
}
