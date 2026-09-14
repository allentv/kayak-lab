## Context

kayak-lab provides an event-sourced agent platform with AgentRuntime, ToolRegistry, and SQLite persistence. The platform already has real implementations of Git and GitHub capabilities (contrary to the README which says "stubbed"). However, it lacks file operations, search capabilities, and a CLI entry point for interactive use.

Key existing components:
- `AgentRuntime`: Orchestrates input → model → tool loop
- `ToolRegistry` (runtime): Register tool handlers for AgentRuntime
- `ModelManager`: Route requests to configured LLM providers
- `GitCapability`: Real git execution via `Deno.Command`
- `GitHubCapability`: Real GitHub API calls via `fetch`
- `EventStore` + `SQLitePersistenceBackend`: Store events in SQLite
- `ShellCapability`: Execute shell commands with safety constraints

## Goals / Non-Goals

**Goals:**
- File read/write/edit operations with safety constraints
- Grep (regex) and glob (file pattern) search capabilities
- CLI entry point with interactive REPL
- Binary distribution for Linux x64 and macOS
- Event capture and session analysis

**Non-Goals:**
- LSP integration (future work)
- Browser automation (future work)
- Multi-agent orchestration (future work)
- Skills system (future work)
- Windows support (future work)

## Decisions

### 1. File Capability Architecture

**Decision:** Create `src/capabilities/file.ts` implementing `ICapability` interface.

**Rationale:**
- Follows existing capability pattern (Shell, Git, GitHub)
- Uses `ICapability` interface for consistency
- Safety constraints: path traversal protection, symlink handling, size limits
- Operations: `read`, `write`, `edit` as separate methods

**Alternatives considered:**
- Use Deno's `std/fs` functions directly: Rejected — no safety constraints
- Create separate read/write/edit capabilities: Over-engineered for current scope

### 2. Search Capability Architecture

**Decision:** Create `src/capabilities/search.ts` implementing `ICapability` interface.

**Rationale:**
- Grep: Use `Deno.Command` with `grep` or `rg` (ripgrep) for regex search
- Glob: Use `Deno.Command` with `find` or `fd` for file pattern matching
- Fall back to Deno's `std/fs` if external tools not available
- Safety constraints: respect `.gitignore` by default

**Alternatives considered:**
- Implement grep/glob in pure TypeScript: Rejected — slower, more code to maintain
- Use only Deno std library: Limited functionality compared to ripgrep

### 3. Git/GitHub Capability Updates

**Decision:** Extend existing `GitCapability` and `GitHubCapability` with additional methods.

**Rationale:**
- Git already has `getStatus`, `getChanges`, `stage`, `unstage`, `commit`, `getHistory`, `getBranches`, `createBranch`, `switchBranch`
- Add: `getDiff`, `push`, `pull` for completeness
- GitHub already has `getRepository`, `listIssues`, `getIssue`, `createIssue`, `listPullRequests`, `getPullRequest`, `createPullRequest`
- Add: `listWorkflows`, `getWorkflowRuns` for CI/CD visibility

**Alternatives considered:**
- Create new capabilities: Rejected — extends existing, not replaces
- Use GitHub CLI (`gh`) instead of API: Adds dependency

### 4. CLI Entry Point Architecture

**Decision:** Create `src/cli.ts` as separate entry point from `src/main.ts`.

**Rationale:**
- `src/main.ts` is HTTP server with WebSocket — too heavy for CLI
- CLI needs readline loop, not HTTP request handling
- Separate entry point allows `deno compile` to produce smaller binary
- Both share core modules (EventStream, SessionManager, Capabilities, etc.)

**Alternatives considered:**
- Add CLI mode to `main.ts`: Mixes HTTP server concerns with REPL loop
- Create shared "harness core" package: Over-engineered for current scope

### 5. Tool Registration Pattern

**Decision:** Register all tools (file, search, git, github) as handlers in runtime `ToolRegistry`.

**Rationale:**
- `AgentRuntime` expects `ToolRegistry` from `src/runtime/tool-registry.ts`
- Each tool wraps a capability method
- Tool parameters follow OpenAI function calling schema
- Context passed to handlers includes working directory

**Alternatives considered:**
- Use `src/tools/registry.ts` (new tool calling protocol): Different interface, not compatible with AgentRuntime

### 6. Event Persistence Strategy

**Decision:** Use `SQLitePersistenceBackend` directly for CLI mode.

**Rationale:**
- CLI doesn't need in-memory EventStore cache
- Reads directly from SQLite for analysis
- Simpler architecture: CLI writes to SQLite, analysis reads from SQLite
- Avoids dual-write complexity

**Alternatives considered:**
- Use `PersistentEventStore`: Adds unnecessary in-memory layer
- Use JSONL files: SQLite enables SQL queries for analysis

### 7. Binary Distribution

**Decision:** Use `deno compile` with cross-compilation targets.

**Rationale:**
- Deno supports cross-compilation to Linux x64, macOS arm64, macOS x64
- Single binary with embedded SQLite (no native dependencies)
- Build script automates target selection and output naming
- Binary size expected under 50MB

**Alternatives considered:**
- Docker distribution: Adds runtime dependency
- npm package: Requires Node.js runtime

## Risks / Trade-offs

### Risk: Model API Key Required

**Impact:** Users must configure `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or similar environment variable.

**Mitigation:** Clear error message if no API key is configured. Consider adding a `--model` flag for future provider selection.

### Risk: Binary Size

**Impact:** Deno + SQLite may exceed 50MB target.

**Mitigation:** Use `--no-check` flag to exclude TypeScript type information. Monitor size during build.

### Risk: External Tool Dependencies

**Impact:** Grep/glob may rely on external tools (ripgrep, fd) not available on all systems.

**Mitigation:** Fall back to Deno std library implementations if external tools not found. Document dependencies.

### Risk: GitHub API Rate Limits

**Impact:** GitHub API calls may hit rate limits (5000 requests/hour for authenticated users).

**Mitigation:** Handle 403 responses with rate limit headers. Cache responses where possible.

### Risk: Safety Bypass

**Impact:** Path traversal or symlink attacks could write files outside project root.

**Mitigation:** Resolve all paths to absolute, verify they start with project root before any write operation.

### Trade-off: Simplicity vs. Features

**Decision:** Start with minimal coding harness (file, search, git, github, CLI) and add features incrementally.

**Rationale:** Enables rapid prototyping and user feedback. Features like LSP, browser, multi-agent can be added later.
