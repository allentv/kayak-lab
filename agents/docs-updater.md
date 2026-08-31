# Docs Updater

Scans codebase for undocumented capabilities, modules, and patterns. Compares against existing docs and produces a diff of what needs updating.

## Usage

```
Use the Docs Updater to check if docs are current
```

## Quick Spawn

```typescript
const result = await task({
  agent: "docs-updater",
  task: `Check if docs/capabilities.md and docs/architecture.md are current with the codebase.`,
});
```

## Full Spawn Example

```typescript
const result = await task({
  agent: "docs-updater",
  context: `Project: kayak-lab — event-sourced agent platform in TypeScript (Deno).
Docs root: docs/
Source root: src/`,
  task: `Audit documentation freshness against the codebase. Follow the checklist.

## Checklist

### 1. Capabilities Audit
Read docs/capabilities.md. Then scan src/capabilities/ for:
- New capability files not documented (e.g., sandboxed-shell.ts, sandbox/)
- New interfaces or classes not mentioned
- Changed method signatures
- New exported types

### 2. Core Modules Audit
Read docs/architecture.md. Then scan src/core/ for:
- New modules not documented (health.ts, config.ts, rate-limiter.ts, bounded-queue.ts)
- New patterns (health checks, rate limiting, config management)
- Changes to existing modules (event-stream.ts, session-manager.ts, etc.)

### 3. Runtime Audit
Scan src/runtime/ for:
- New modules or significant changes
- Updated interfaces

### 4. Projection Audit
Scan src/projection/ for:
- New projection types (websocket-server.ts)
- Updated protocol behavior

### 5. Test Infrastructure Audit
Scan src/__test-utils__/ for:
- New mock registries
- New test helpers or harnesses
- Fixture files

## Output Format

Return a structured report:

\`\`\`typescript
interface DocsAuditResult {
  sections: Array<{
    file: string;          // e.g., "docs/capabilities.md"
    status: "current" | "outdated" | "missing";
    gaps: string[];        // What's missing or outdated
    suggestedChanges: string[];  // Specific edits to make
  }>;
  summary: string;
}
\`\`\`

## Rules
- Read existing docs before scanning code — don't assume what's documented
- Compare actual exports and interfaces, not file names
- Flag changed method signatures as outdated
- New files without corresponding doc sections = "missing"
- Changed behavior without doc updates = "outdated"
- Don't suggest creating new doc files — update existing ones
- Be specific: name the file, the symbol, and what's missing`,
});
```

## Audit Checklist

1. **Capabilities** — Every `I*Capability` interface and its implementation class must appear in `docs/capabilities.md` with usage example
2. **Core Modules** — Every file in `src/core/` must have a corresponding section in `docs/architecture.md`
3. **Runtime** — Agent runtime, model provider, tool registry changes must be reflected
4. **Projections** — New projection types (WebSocket, terminal) must be documented
5. **Test Infrastructure** — Mock registry and helpers should be mentioned in contributing guide
6. **Exports** — New public exports from `mod.ts` files must appear in relevant docs
7. **Configuration** — New config options or env vars must be documented
8. **Scripts** — Setup and utility scripts must be mentioned in getting-started or contributing

## Output Format

```typescript
interface DocsAuditResult {
  sections: Array<{
    file: string;
    status: "current" | "outdated" | "missing";
    gaps: string[];
    suggestedChanges: string[];
  }>;
  summary: string;
}
```

## Tips

- Run after archiving a change to catch documentation drift early
- Focus on public APIs and user-facing features, not internal implementation details
- When suggesting changes, provide the exact text to add or modify
- Cross-reference with `src/capabilities/mod.ts` exports for completeness
