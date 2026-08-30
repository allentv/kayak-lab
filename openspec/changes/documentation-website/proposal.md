## Why

kayak-lab has no public-facing documentation. The README covers architecture and concepts but isn't browsable, searchable, or deployable as a website. A VitePress documentation site provides a proper home for architecture docs, getting-started guides, API references, and contribution guidelines — all version-controlled alongside the code and auto-deployed via GitHub Pages.

## What Changes

- **VitePress documentation site** under `docs/` with landing page, architecture, getting-started, event types, sessions, capabilities, contributing, and changelog pages
- **GitHub Actions workflow** for automated deployment to GitHub Pages on push to `main`
- **pnpm** as the package manager for the docs site
- **Custom theme** extending VitePress default with a light blue / pale green / light orange color palette (light and dark modes)
- **MermaidJS diagrams** replacing ASCII art for architecture block diagram, data flow sequence diagram, and session state machines

### New Capabilities

- `docs/vitepress-site`: VitePress documentation site with custom theme and Mermaid diagrams
- `docs/github-deployment`: GitHub Actions workflow for automated Pages deployment

### Modified Capabilities

None — this is additive infrastructure, no existing behavior changes.

## Capabilities

### New Capabilities

- `docs/vitepress-site`: Static documentation site built with VitePress, custom CSS theme, MermaidJS diagram support
- `docs/github-deployment`: CI/CD pipeline deploying docs to GitHub Pages via GitHub Actions

### Modified Capabilities

None
