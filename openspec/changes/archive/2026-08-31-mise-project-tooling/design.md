## Context

mise is installed globally (v2026.5.16) with ripgrep and uv in `~/.config/mise/config.toml`. kayak-lab has no project-level `.mise.toml` and deno is not currently installed. The project uses deno.json with tasks (test, fmt, lint, check).

## Goals / Non-Goals

**Goals:**
- Pin deno minor version for this project
- Zero impact on existing global mise tools
- Format supports adding tools later without restructuring

**Non-Goals:**
- CI/CD integration
- Lock file pinning to exact patch (minor-track is sufficient)
- Managing deno's npm/jsr dependencies (that's deno.json's job)

## Decisions

### D1: Project-level `.mise.toml` (not global)

**Decision:** Create `.mise.toml` at project root, not in global config.

**Rationale:** deno is kayak-lab-specific. Global config should stay for cross-project tools (ripgrep, uv). mise auto-activates `.mise.toml` on directory entry — no shell hooks needed.

### D2: Minor-track version pinning

**Decision:** Pin to `"2.9"` (latest minor), not `"2.9.6"` (exact patch).

**Rationale:** Agents get security patches automatically. Breaking changes within a minor are rare in deno. If exact reproducibility is needed later, the lock file handles it.

### D3: Append `.mise.lock` to gitignore

**Decision:** Add `.mise.lock` to existing `.gitignore`, not a separate ignore file.

**Rationale:** Single source of truth for ignores. `.mise.lock` is machine-generated and not useful to commit.

## Risks / Trade-offs

- **Risk:** Deno minor bumps could break agent scripts. **Mitigation:** Low probability; deno follows semver within 2.x. Can pin exact patch if needed.
- **Trade-off:** No lock file committed means two machines could resolve to different patches. Acceptable for dev tooling; would matter for CI (out of scope).
