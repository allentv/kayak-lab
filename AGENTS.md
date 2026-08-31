# Agents

Reusable agent configurations for kayak-lab. Detailed configs live in `agents/`.

---

## Agent Registry

| Agent | Purpose | Config | Speed |
|-------|---------|--------|-------|
| `reviewer` | Code quality, decomposition, test coverage | [agents/reviewer.md](agents/reviewer.md) | Medium |
| `scout` | Read-only research, learning capture | [agents/scout.md](agents/scout.md) | Fast |
| `docs-updater` | Documentation freshness audit | [agents/docs-updater.md](agents/docs-updater.md) | Fast |

### Built-in Agents (OMP)

| Agent | Purpose | Speed |
|-------|---------|-------|
| `task` | General-purpose with full capabilities | Medium |
| `designer` | UI/UX implementation and review | Medium |

---

## Adding New Agents

1. Create `agents/<name>.md` with full configuration
2. Add a row to the Agent Registry table above
3. Include: usage, spawn examples, checklist/output schema, tips

---

## Running Code Review

### Manual

```bash
# Run all tests first
deno test --allow-read --allow-env --allow-run

# Then spawn code reviewer
# (via task subagent in OMP)
```

### Automated

Code review can be triggered:

- After completing a phase of work
- Before committing significant changes
- When asked to "review the code"

### Integration with OpenSpec

When working on an OpenSpec change:

1. Complete implementation tasks
2. Run code reviewer on changed files
3. Apply findings
4. Verify tests still pass
5. Commit and archive

---

## Tips

- **Be specific**: Point the reviewer at specific files or directories
- **Run tests first**: Ensure code compiles and tests pass before review
- **Apply selectively**: Not all findings need to be fixed; use judgment
- **Verify after changes**: Always run tests after applying review findings
