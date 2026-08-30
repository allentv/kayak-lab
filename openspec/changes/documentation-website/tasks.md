## 1. VitePress Setup

- [x] 1.1 Initialize `docs/package.json` with vitepress devDependency. Verify: `pnpm install` succeeds.
- [x] 1.2 Create `docs/.vitepress/config.ts` with title, description, base path, nav, sidebar, social links, footer. Verify: `pnpm vitepress dev` starts.
- [x] 1.3 Enable MermaidJS: add `markdown: { mermaid: true }` to config. Verify: `mermaid` code blocks render.
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

- [x] 4.1 Convert architecture ASCII block diagram to Mermaid `graph TB`. Verify: diagram renders correctly.
- [x] 4.2 Convert architecture data flow ASCII to Mermaid `sequenceDiagram`. Verify: diagram renders correctly.
- [x] 4.3 Convert sessions ASCII state machine to Mermaid `stateDiagram-v2`. Verify: diagram renders correctly.
- [x] 4.4 Convert event-types ASCII transitions to Mermaid `stateDiagram-v2`. Verify: diagram renders correctly.

## 5. GitHub Actions Deployment

- [x] 5.1 Create `.github/workflows/deploy-docs.yml` with push trigger on `docs/**`, workflow_dispatch. Verify: workflow syntax valid.
- [x] 5.2 Add pnpm setup step (`pnpm/action-setup@v4`), deno setup, install, build, upload artifact, deploy steps. Verify: workflow completes.
- [x] 5.3 Add concurrency group to prevent parallel deploys. Verify: concurrent pushes queue correctly.
- [x] 5.4 Replace npm lockfile with pnpm lockfile (`pnpm-lock.yaml`). Verify: `pnpm install` produces consistent lockfile.

## 6. MermaidJS Migration

- [x] 6.1 Replace architecture ASCII diagram with Mermaid block diagram. Verify: visual parity.
- [x] 6.2 Replace architecture data flow ASCII with Mermaid sequence diagram. Verify: visual parity.
- [x] 6.3 Replace sessions ASCII state diagram with Mermaid state diagram. Verify: visual parity.
- [x] 6.4 Replace event-types ASCII transitions with Mermaid state diagram. Verify: visual parity.

## 7. Verification

- [x] 7.1 Run `pnpm vitepress build` — verify build completes without errors. Verify: `docs/.vitepress/dist/` contains HTML files.
- [x] 7.2 Verify all pages are present in build output. Verify: index, architecture, getting-started, event-types, sessions, capabilities, contributing, changelog.
- [x] 7.3 Verify Mermaid diagrams render as SVG in build output. Verify: no raw `mermaid` code blocks in HTML.
- [x] 7.4 Verify custom theme CSS is included in build output. Verify: brand colors present in CSS bundle.
