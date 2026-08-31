## 1. VitePress Setup

- [x] 1.1 Initialize `docs/package.json` with vitepress devDependency. Verify: `pnpm install` succeeds.
- [x] 1.2 Create `docs/.vitepress/config.ts` with title, description, base path, nav, sidebar, social links, footer. Verify: `pnpm vitepress dev` starts.
- [x] 1.3 Enable MermaidJS: install `mermaid` and `vitepress-plugin-mermaid`, configure with `withMermaid()`. Verify: `mermaid` code blocks render as SVG.
- [x] 1.4 Add `docs/.gitignore` entries for `.vitepress/dist/` and `.vitepress/cache/`. Verify: build output not tracked.

## 2. Content Pages

- [x] 2.1 Create `docs/index.md` with VitePress home layout, hero, and feature cards. Verify: landing page renders.
- [x] 2.2 Create `docs/getting-started.md` with setup, project structure, core usage examples. Verify: page renders.
- [x] 2.3 Create `docs/architecture.md` with three-layer architecture, Mermaid diagrams, design principles. Verify: diagrams render.
- [x] 2.4 Create `docs/event-types.md` with all 25 event types, type guards, filtering examples. Verify: page renders.
- [x] 2.5 Create `docs/sessions.md` with session states, Mermaid state diagram, lifecycle, recovery. Verify: diagram renders.
- [x] 2.6 Create `docs/capabilities.md` with capability interface, available capabilities, registry. Verify: page renders.
- [x] 2.7 Create `docs/contributing.md` with setup, conventions, commit format, OpenSpec workflow. Verify: page renders.
- [x] 2.8 Create `docs/changelog.md`. Verify: page renders.

## 3. Custom Theme

- [x] 3.1 Create `docs/.vitepress/theme/index.ts` importing default theme and custom CSS. Verify: theme loads.
- [x] 3.2 Create `docs/.vitepress/theme/custom.css` with light blue / pale green / light orange palette, dark mode, hero gradient, custom blocks. Verify: colors applied.
- [x] 3.3 Verify dark mode toggle works with adjusted palette. Verify: no layout shift on toggle.

## 4. MermaidJS Diagrams

- [x] 4.1 Install `mermaid` and `vitepress-plugin-mermaid` as devDependencies. Verify: `pnpm install` succeeds.
- [x] 4.2 Configure `withMermaid()` in config.ts with mermaid theme and brand color variables. Verify: config compiles without TS errors.
- [x] 4.3 Convert architecture ASCII block diagram to Mermaid `graph TB`. Verify: diagram renders as SVG.
- [x] 4.4 Convert architecture data flow ASCII to Mermaid `sequenceDiagram`. Verify: diagram renders as SVG.
- [x] 4.5 Convert sessions ASCII state machine to Mermaid `stateDiagram-v2`. Verify: diagram renders as SVG.
- [x] 4.6 Convert event-types ASCII transitions to Mermaid `stateDiagram-v2`. Verify: diagram renders as SVG.

## 5. GitHub Actions Deployment

- [x] 5.1 Create `.github/workflows/deploy-docs.yml` with push trigger on `docs/**`, workflow_dispatch. Verify: workflow syntax valid.
- [x] 5.2 Add pnpm setup (`pnpm/action-setup@v6`), install, build, upload artifact, deploy steps. Remove unused deno setup. Verify: workflow completes.
- [x] 5.3 Add concurrency group to prevent parallel deploys. Verify: concurrent pushes queue correctly.
- [x] 5.4 Replace npm lockfile with pnpm lockfile (`pnpm-lock.yaml`). Verify: `pnpm install` produces consistent lockfile.
- [x] 5.5 Update actions to Node 24-compatible versions: checkout@v7, pnpm/action-setup@v6, upload-pages-artifact@v5, deploy-pages@v5. Verify: no deprecation warnings.

## 6. Verification

- [x] 6.1 Run `pnpm vitepress build` — verify build completes without errors. Verify: `docs/.vitepress/dist/` contains HTML files.
- [x] 6.2 Verify all pages are present in build output. Verify: index, architecture, getting-started, event-types, sessions, capabilities, contributing, changelog.
- [x] 6.3 Verify Mermaid diagrams render as SVG in build output. Verify: `<div class="mermaid">` present, no raw code blocks.
- [x] 6.4 Verify custom theme CSS is included in build output. Verify: brand colors present in CSS bundle.
