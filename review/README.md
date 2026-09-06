# Review CLI

Standalone code review tool that pre-filters hotspots before LLM review.

## Usage

```bash
deno task review                      # all checks
deno task review --only file-size     # one check
deno task review --skip preflight     # skip preflight
deno task review --fail-on 1          # CI gate on critical findings
```

## Output

Findings are grouped by file with priority labels (CRIT/WARN/INFO) and a summary line. Each finding conforms to the `Finding` schema:

```typescript
interface Finding {
  title: string;
  body: string;
  priority: 1 | 2 | 3;  // 1=critical, 2=important, 3=minor
  confidence: number;     // 0-1
  file_path: string;
  line_start: number;
  line_end: number;
}
```

## Adding a Check

Drop a `.ts` file in `review/checks/`. Export a default `ReviewCheck`:

```typescript
import type { Finding, ReviewCheck, ReviewContext } from "../types.ts";

const check: ReviewCheck = {
  name: "my-check",
  description: "What this check does",
  async run(ctx: ReviewContext): Promise<Finding[]> {
    const findings: Finding[] = [];
    // ... scan ctx.files, produce findings
    return findings;
  },
};

export default check;
```

The check is auto-discovered on next run — no wiring needed.

## Adding a Tool Delegate

Drop a `.ts` file in `review/delegate/`. Same contract as checks but typically spawns a subprocess:

```typescript
import type { Finding, ReviewCheck } from "../types.ts";

const check: ReviewCheck = {
  name: "my-tool",
  description: "Runs an external tool",
  async run(): Promise<Finding[]> {
    const cmd = new Deno.Command("my-tool", { args: [...], stdout: "piped" });
    const output = await cmd.output();
    // parse output into Finding[]
    return findings;
  },
};

export default check;
```

## Dependencies

- **Required**: None — runs with just Deno
- **Optional**: `knip` (unused exports), `madge` (circular deps) — gracefully skipped if not installed

## Architecture

```
review/
  types.ts          # Finding, ReviewCheck, ReviewContext
  context.ts        # Pre-computes file metadata, test pairing, export/import lists
  registry.ts       # Auto-discovers checks and delegates
  formatter.ts      # Colored, grouped output
  cli.ts            # Entrypoint with --only, --skip, --fail-on
  checks/           # Custom checks (file-size, test-pairing, reexports)
  delegate/         # Tool parsers (deno-lint, deno-check, knip, madge)
```

`ReviewContext` is built once before checks run — no file is read more than once.