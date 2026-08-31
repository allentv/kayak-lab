---
name: docs-freshness
description: Check and update documentation after shipping a change. Use after archiving an OpenSpec change to ensure docs reflect new capabilities, modules, and patterns.
allowed-tools: Bash(openspec:*), Task
---

Check and update documentation after shipping a change. Use when a change is archived, or when docs may be stale.

## When to Run

- **After archiving** an OpenSpec change (hook into archive workflow)
- **Before pushing** commits that include new capabilities or modules
- **On request** when user asks "are the docs up to date?"

## Steps

### 1. Detect What Changed

Compare the archived change's delta specs and implementation against existing docs:

```bash
# List files changed in the last commit(s)
git diff --name-only HEAD~N..HEAD -- src/
```

Identify:
- New capability interfaces (`I*Capability`)
- New core modules (`src/core/*.ts`)
- New runtime modules (`src/runtime/*.ts`)
- New projection types (`src/projection/*.ts`)
- New scripts (`scripts/*.sh`)
- New configuration options or env vars

### 2. Audit Documentation

Read each doc file and compare against the codebase:

| Doc File | Check For |
|----------|-----------|
| `docs/capabilities.md` | Every `I*Capability` interface, implementation class, usage example |
| `docs/architecture.md` | Every `src/core/` module, pattern description |
| `docs/getting-started.md` | Setup scripts, prerequisites |
| `docs/learnings.md` | Patterns, gotchas, decisions from the change |
| `docs/changelog.md` | Entry for the completed change |
| `docs/event-types.md` | New event types if added |

### 3. Generate Update Plan

For each outdated or missing section, produce:

```typescript
interface DocUpdate {
  file: string;
  section: string;       // Heading to update or add under
  action: "add" | "update" | "append";
  content: string;       // Markdown to insert
  reason: string;        // Why this change is needed
}
```

### 4. Apply Updates

Update each doc file:

- **New capability**: Add section under "Available Capabilities" with interface, usage example, and key methods
- **New core module**: Add section under "Architecture" with purpose, key types, and usage
- **New script**: Add to "Getting Started" or "Contributing" with purpose and usage
- **New pattern**: Add to "Learnings" with decision rationale and gotchas
- **Changelog entry**: Add entry under appropriate version heading

### 5. Verify

After updates:
- Ensure all code examples compile (`deno check` if applicable)
- Cross-reference exports from `mod.ts` files against documented APIs
- Check no duplicate sections were created

## Doc File Templates

### New Capability Section

```markdown
### <CapabilityName>

<Brief description of what it does.>

\`\`\`typescript
import { <Implementation> } from "./src/capabilities/<file>.ts";

const <var> = new <Implementation>();
await <var>.initialize({ session_id: "my-session" });

// Usage example
const result = await <var>.<method>();
\`\`\`

**Key methods:**

| Method | Returns |
|--------|---------|
| `<method>()` | `<ReturnType>` — description |
```

### New Core Module Section

```markdown
### <ModuleName>

<Purpose and role in the system.>

\`\`\`typescript
import { <Exports> } from "./src/core/<file>.ts";

// Usage example
\`\`\`

**Key types:** `<Type1>`, `<Type2>`
**Key functions:** `<fn1>()`, `<fn2>()`
```

### Changelog Entry

```markdown
### <Version> — <Date>

#### Added
- <Feature>: <brief description> (<change-name>)

#### Changed
- <Component>: <what changed>

#### Fixed
- <Bug>: <what was fixed>
```

## Integration with Archive Workflow

After `openspec archive` completes, automatically run:

1. Detect which capabilities/modules were added or changed
2. Audit relevant doc files
3. Apply updates
4. Include doc updates in the archive commit

This ensures no change ships without documentation.

## Tips

- Focus on public APIs and user-facing features
- Don't document internal implementation details
- Keep code examples copy-pasteable and working
- Cross-reference with `mod.ts` exports for completeness
- Update `docs/changelog.md` with a summary entry
