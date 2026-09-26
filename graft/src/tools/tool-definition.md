# src/tools/tool-definition.ts · [[tool-calling-system]]

- ToolDefinitionError · class · L14-L22 — class ToolDefinitionError extends Error
- constructor · method · L15-L21 — constructor( message: string, public readonly toolName?: string, )
- ParameterValidationError · class · L24-L35 — class ParameterValidationError extends ToolDefinitionError
- constructor · method · L27-L34 — constructor( toolName: string, errors: string[], )
- ToolDefinition · class · L47-L256 — class ToolDefinition
- constructor · method · L50-L52 — private constructor(definition: IToolDefinition)
- create · method · L59-L68 — static create(definition: IToolDefinition): ToolDefinition
- validate · method · L74-L95 — static validate(definition: IToolDefinition): string[]
- validateParameters · method · L100-L138 — private static validateParameters(params: ParameterSchema): string[]
- validateParameters · method · L145-L175 — validateParameters(params: Record<string, unknown>): void
- validateProperty · method · L180-L216 — private validateProperty( name: string, value: unknown, schema: ParameterProperty, ): string[]
- matchType · method · L221-L238 — private matchType(value: unknown, type: string): boolean
- definition · method · L241-L243 — get definition(): Readonly<IToolDefinition>
- name · method · L246-L248 — get name(): string
- toJSON · method · L253-L255 — toJSON(): IToolDefinition
