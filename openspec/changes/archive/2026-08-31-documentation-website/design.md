## Context

kayak-lab has comprehensive Markdown documentation in the README covering architecture, concepts, and project structure, but no browsable website. The project uses Deno 2, TypeScript, and an event-sourced architecture. Documentation should live alongside code and deploy automatically.

## Goals / Non-Goals

**Goals:**
- Static documentation site deployable to GitHub Pages
- Custom color theme (light blue, pale green, light orange) with dark mode
- MermaidJS diagram support for architecture and state diagrams
- Automated deployment via GitHub Actions on push to `main`
- pnpm for dependency management

**Non-Goals:**
- Interactive API explorer (future enhancement)
- Versioned docs (single version for now)
- Search functionality (VitePress default search requires Algolia or local index — future)
- Blog or changelog feed (static changelog page sufficient)

## Decisions

### 1. VitePress over alternatives

**Decision:** Use VitePress as the static site generator.

**Rationale:**
- Native Markdown → site pipeline, no build step for content
- Built-in sidebar, nav, dark mode, social links
- MermaidJS support via `markdown.mermaid` config
- Vue/Vite ecosystem — fast dev server and build
- Lightweight — single `npm install` + `npx vitepress build`

**Alternatives considered:**
- Docusaurus: Heavier, React-based, more configuration for simple docs
- Astro: More flexible but overkill for Markdown-only docs
- Nextra: Next.js-based, adds SSR complexity unnecessary for static docs

### 2. Custom theme via CSS variables on default theme

**Decision:** Extend VitePress default theme with custom CSS variables rather than replacing the theme.

**Rationale:**
- Zero new dependencies — pure CSS overrides
- Upgrade-friendly — VitePress updates don't break custom layout
- Full control over brand colors, button styles, custom blocks, hero gradient
- Dark mode handled by overriding `.dark` selector variables

**Alternatives considered:**
- Community theme (e.g., vitepress-carbon): Adds dependency, less control over exact palette
- Full custom theme: Massive effort, fragile to VitePress upgrades

### 3. pnpm over npm

**Decision:** Use pnpm for the docs site package management.

**Rationale:**
- Faster installs, stricter dependency resolution
- `pnpm/action-setup@v4` is the standard GitHub Action for pnpm
- Consistent lockfile (`pnpm-lock.yaml`) for reproducible builds

### 4. MermaidJS via VitePress built-in support

**Decision:** Enable `markdown.mermaid: true` in VitePress config rather than adding a separate Mermaid integration.

**Rationale:**
- First-party VitePress feature — no extra plugins
- Renders client-side with `mermaid` package auto-installed
- Supports all Mermaid diagram types (graph, sequence, state, etc.)

### 5. GitHub Actions with Pages deployment

**Decision:** Use `actions/upload-pages-artifact` + `actions/deploy-pages` for deployment.

**Rationale:**
- Official GitHub Pages deployment flow
- Atomic deployments — build artifact uploaded first, then deployed
- Concurrency group prevents parallel deploys
- `workflow_dispatch` for manual triggers

**Alternatives considered:**
- `gh-pages` branch approach: Branch bloat, less atomic
- Netlify/Vercel: External dependency, overkill for docs

## Risks / Trade-offs

### Risk: MermaidJS adds client-side JavaScript

**Impact:** Low — Mermaid bundles ~500KB but only loads on pages with diagrams. VitePress code-splits automatically.

**Mitigation:** Acceptable for documentation site performance. No SSR impact.

### Risk: Color theme may not meet WCAG contrast requirements

**Impact:** Medium — accessibility is important for documentation.

**Mitigation:** Custom block colors use semi-transparent backgrounds with dark text in light mode, bright text in dark mode. Manual verification needed.

### Risk: GitHub Pages has build limits

**Impact:** Low — 1000 builds/hour is sufficient for docs.

**Mitigation:** `paths: ["docs/**"]` filter prevents unnecessary builds.

## Migration Plan

1. All artifacts are already implemented — this change documents existing work
2. Enable GitHub Pages in repo settings (Settings → Pages → Source: GitHub Actions)
3. Push to `main` triggers first deployment

## Open Questions

None — all decisions are resolved and implemented.
