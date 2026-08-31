## 1. Create mise project config

- [x] 1.1 Create `.mise.toml` at project root with `[tools]` section pinning `deno = "2.9"`
- [x] 1.2 Verify: run `mise install` in project root and confirm deno installs at 2.9.x

## 2. Update gitignore

- [x] 2.1 Append `.mise.lock` to `.gitignore`
- [x] 2.2 Verify: run `mise install`, then `git status` shows no untracked `.mise.lock`

## 3. Smoke test agent activation

- [x] 3.1 From a clean shell, `cd` into kayak-lab and verify `which deno` resolves to mise-managed path
- [x] 3.2 Verify `deno --version` reports the 2.9.x version pinned in `.mise.toml`
- [x] 3.3 Verify existing global tools (ripgrep, uv) still work outside the project directory
