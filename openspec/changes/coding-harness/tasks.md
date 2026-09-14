## 1. File Capability

- [ ] 1.1 Create `src/capabilities/file.ts` implementing `ICapability` with `read`, `write`, `edit` methods. Verify: `deno check src/capabilities/file.ts` passes.
- [ ] 1.2 Implement `read(path, options?)` with range selection (offset/limit), binary file detection, and directory listing. Verify: unit test reads text file, binary file, and directory.
- [ ] 1.3 Implement `write(path, content)` with parent directory creation and path traversal protection. Verify: unit test creates file and rejects paths outside project root.
- [ ] 1.4 Implement `edit(path, old_string, new_string, options?)` with unique match validation and replace_all option. Verify: unit test edits file, rejects non-unique match, handles replace_all.
- [ ] 1.5 Add safety constraints: path traversal protection, symlink handling, 10MB file size limit. Verify: unit test rejects paths with `..`, symlinks outside root, and large files.

## 2. Search Capability

- [ ] 2.1 Create `src/capabilities/search.ts` implementing `ICapability` with `grep` and `glob` methods. Verify: `deno check src/capabilities/search.ts` passes.
- [ ] 2.2 Implement `grep(pattern, path, options?)` with regex search, case-insensitive option, and file filter. Verify: unit test finds patterns across files.
- [ ] 2.3 Implement `glob(pattern, options?)` with file pattern matching, hidden file inclusion, and gitignore respect. Verify: unit test finds files by pattern.
- [ ] 2.4 Add fallback to Deno std library if external tools (ripgrep, fd) not available. Verify: unit test works without external tools.

## 3. Git Capability Updates

- [ ] 3.1 Add `getDiff(path?, options?)` method to `GitCapability` for showing diffs. Verify: unit test returns diff output.
- [ ] 3.2 Add `push(remote?, branch?)` method to `GitCapability`. Verify: unit test pushes changes.
- [ ] 3.3 Add `pull(remote?, branch?)` method to `GitCapability`. Verify: unit test pulls changes.

## 4. GitHub Capability Updates

- [ ] 4.1 Add `listWorkflows(owner, repo)` method to `GitHubCapability`. Verify: unit test returns workflows.
- [ ] 4.2 Add `getWorkflowRuns(owner, repo, workflowId?)` method to `GitHubCapability`. Verify: unit test returns workflow runs.
- [ ] 4.3 Add rate limit handling with 403 response detection and reset time error. Verify: unit test handles rate limit.

## 5. CLI Entry Point

- [ ] 5.1 Create `src/cli.ts` with subcommand parsing (`run`, `analyze`, `export`) and `--project` flag. Verify: `deno check src/cli.ts` passes.
- [ ] 5.2 Add project detection function that scans for `deno.json`, `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`. Verify: unit test detects each project type.
- [ ] 5.3 Initialize harness components: `EventStream`, `SessionManager`, `CapabilityRegistry`, `ShellCapability`, `GitCapability`, `GitHubCapability`, `FileCapability`, `SearchCapability`. Verify: components created without errors.
- [ ] 5.4 Initialize `ModelManager` with API key validation and clear error message if missing. Verify: error message displayed when no API key.
- [ ] 5.5 Initialize runtime `ToolRegistry` with file, search, git, github, shell tool handlers. Verify: tools registered and invocable.
- [ ] 5.6 Implement readline loop with prompt `[kayak]$ ` and line reading from stdin. Verify: prompt displayed, input read correctly.
- [ ] 5.7 Wire user input to `AgentRuntime.processInput()`. Verify: natural language input processed, response displayed.
- [ ] 5.8 Add `:quit`, `:status`, `:history` commands. Verify: commands work correctly.
- [ ] 5.9 Add real-time event display with ANSI coloring for tool calls and results. Verify: tool execution shown during processing.

## 6. Event Persistence and Analysis

- [ ] 6.1 Initialize `SQLitePersistenceBackend` with `.kayak/events.sqlite` path. Verify: database file created.
- [ ] 6.2 Implement `analyzeSessions()` function that calculates session summary, command statistics, and improvement suggestions. Verify: unit test generates correct analysis.
- [ ] 6.3 Implement `formatAnalysisReport()` with ANSI-colored terminal output. Verify: report formatted correctly.
- [ ] 6.4 Implement `analyze` subcommand that reads SQLite and displays report. Verify: `kayak analyze` shows report.
- [ ] 6.5 Implement `export` subcommand that outputs JSON to stdout. Verify: `kayak export` produces valid JSON.

## 7. Binary Distribution

- [ ] 7.1 Create `scripts/build-cli.sh` that compiles `src/cli.ts` for linux-x64, macos-arm64, macos-x64. Verify: binaries produced for each target.
- [ ] 7.2 Test linux-x64 binary runs without Deno installed. Verify: binary starts REPL in test project.
- [ ] 7.3 Verify binary size under 50MB. Verify: `ls -lh` shows size under 50MB.

## 8. Integration Testing

- [ ] 8.1 Write integration test that starts REPL, sends file read request, and verifies response. Verify: test passes.
- [ ] 8.2 Write integration test that creates session, executes git status, and verifies events persisted. Verify: test passes.
- [ ] 8.3 Write integration test that runs analysis on captured sessions and verifies report output. Verify: test passes.
