## Why

kayak-lab provides an event-sourced agent platform with AgentRuntime, ToolRegistry, and SQLite persistence, but lacks the file operations, search capabilities, and real Git/GitHub execution needed for a coding harness. Developers need a drop-in binary that can read/write/edit files, search code, execute git commands, and interact with GitHub — all captured as events for analysis and replay.

## What Changes

- **File operations**: New capabilities for reading, writing, and editing files with safety constraints
- **Search capabilities**: Grep (regex search) and glob (file pattern matching) for codebase exploration
- **Git capability**: Replace stubbed implementation with real `Deno.Command` execution
- **GitHub capability**: Replace stubbed implementation with real GitHub API calls
- **CLI entry point**: Interactive REPL for natural language input with tool execution
- **Model configuration**: Environment variable and config file support for LLM providers
- **Binary distribution**: `deno compile` for Linux x64 and macOS (arm64 + x64)

## Capabilities

### New Capabilities

- `file`: File read, write, and edit operations with safety constraints
- `search`: Code search via grep (regex) and glob (pattern matching)
- `cli`: Interactive REPL, project detection, binary distribution

### Modified Capabilities

- `git`: Replace stubbed implementation with real `Deno.Command` execution
- `github`: Replace stubbed implementation with real GitHub API calls

## Scope

### In Scope

- File read (single file, range, directory listing)
- File write (create, overwrite)
- File edit (surgical string replacement)
- Grep (regex search across files)
- Glob (file pattern matching)
- Git operations (status, diff, commit, branch, log, push, pull)
- GitHub operations (repos, issues, PRs, actions)
- Interactive REPL with natural language input
- Project detection (deno, node, rust, go, python)
- Model configuration (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- Event capture to SQLite
- Session analysis with command frequency, timing, errors
- Binary distribution for Linux x64 and macOS

### Out of Scope

- LSP integration (future work)
- Browser automation (future work)
- Multi-agent orchestration (future work)
- Skills system (future work)
- Memory system wiring (future work)
- Windows support (future work)

## Success Criteria

- Binary compiles and runs on Linux x64 and macOS
- File operations work correctly with safety constraints (no writes outside project)
- Grep finds regex patterns across codebase
- Glob finds files by pattern
- Git commands execute real operations (status, diff, commit)
- GitHub API calls work for repos, issues, PRs
- REPL accepts natural language and executes tools
- Events captured to SQLite for analysis
- Analysis report shows command frequency, timing, errors
- Binary size under 50MB
