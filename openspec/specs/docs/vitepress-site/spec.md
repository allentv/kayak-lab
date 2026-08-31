## ADDED Requirements

### REQ-DOCS-01: Static documentation site

The system MUST provide a VitePress-based static documentation site under `docs/`.

**Scenarios:**

- **Scenario: Landing page renders**
  - GIVEN a user visits the root URL
  - THEN the page displays the project name, tagline, feature highlights, and navigation links

- **Scenario: Content pages are browsable**
  - GIVEN the site is deployed
  - WHEN a user navigates to any content page (architecture, getting-started, event-types, sessions, capabilities, contributing, changelog)
  - THEN the page renders Markdown content with proper headings, code blocks, and tables

- **Scenario: Navigation sidebar works**
  - GIVEN a user is on any page
  - THEN the sidebar shows grouped navigation (Introduction, Core Concepts, Development)
  - AND clicking any item navigates to the corresponding page

- **Scenario: Dark mode toggle works**
  - GIVEN a user is on any page
  - WHEN the user toggles dark mode
  - THEN all colors switch to the dark palette without layout shift

### REQ-DOCS-02: Custom theme

The documentation site MUST use a custom VitePress theme extending the default, with a color palette of light blue, pale green, and light orange.

**Acceptance Criteria:**
- Brand color: light blue (`#5b9bd5`)
- Tip/success accent: pale green (`#95d5b2`)
- Warning/highlight accent: light orange (`#f4a261`)
- Hero gradient flows across all three colors
- Full dark mode support with adjusted brightness
- Custom blocks (tip, warning, info) use the corresponding accent colors
- Zero additional CSS dependencies beyond the default theme

### REQ-DOCS-03: MermaidJS diagram support

The documentation site MUST render MermaidJS diagrams inline in Markdown files.

**Scenarios:**

- **Scenario: Mermaid diagram renders**
  - GIVEN a Markdown file contains a ` ```mermaid ` code block
  - WHEN the page is rendered
  - THEN the diagram is displayed as an SVG/graphical rendering (not raw text)

- **Scenario: Architecture block diagram**
  - GIVEN the architecture page is viewed
  - THEN a block diagram shows the three-layer architecture (Core, Capabilities, Projections) with component relationships

- **Scenario: Data flow sequence diagram**
  - GIVEN the architecture page is viewed
  - THEN a sequence diagram shows event flow from user input through agent runtime, model provider, tool registry, capabilities, and event stream to projection surfaces

- **Scenario: Session state diagrams**
  - GIVEN the sessions or event-types page is viewed
  - THEN a state diagram shows session lifecycle transitions (active ↔ paused, active → completed/failed/cancelled)

### REQ-DOCS-04: Content coverage

The documentation site MUST include the following pages with content covering the corresponding areas:

| Page | Content |
|------|---------|
| `index.md` | Landing page with hero, features, and project overview |
| `getting-started.md` | Setup instructions, project structure, core usage examples |
| `architecture.md` | Three-layer architecture, Core/Capability/Projection layers, design principles |
| `event-types.md` | All 25 event types across 7 categories, type guards, filtering |
| `sessions.md` | Session states, lifecycle, properties, event emission, recovery |
| `capabilities.md` | Capability interface, available capabilities, registry, adding new capabilities |
| `contributing.md` | Setup, conventions, commit format, code review, OpenSpec workflow |
| `changelog.md` | Project changelog |
