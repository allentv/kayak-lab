## ADDED Requirements

### REQ-DEPLOY-01: Automated GitHub Pages deployment

The system MUST deploy the documentation site to GitHub Pages via a GitHub Actions workflow.

**Scenarios:**

- **Scenario: Deployment triggers on push**
  - GIVEN a developer pushes changes to `main` that modify files under `docs/`
  - THEN the GitHub Actions workflow runs automatically
  - AND the documentation site is built and deployed to GitHub Pages

- **Scenario: Manual deployment trigger**
  - GIVEN the workflow is idle
  - WHEN a maintainer triggers `workflow_dispatch`
  - THEN the documentation site is built and deployed

- **Scenario: Build uses pnpm**
  - GIVEN the workflow runs
  - THEN dependencies are installed with `pnpm install`
  - AND the site is built with `pnpm vitepress build`

- **Scenario: Deployment target**
  - GIVEN the build succeeds
  - THEN the built site is deployed to the `github-pages` environment
  - AND the site is available at `https://<org>.github.io/kayak-lab/`

### REQ-DEPLOY-02: Build isolation

The documentation build MUST NOT affect the main project build or test pipeline.

**Acceptance Criteria:**
- The workflow runs only when `docs/**` files change
- The workflow does not run test suites or lint the main project
- `node_modules` and `.vitepress/cache` are gitignored
- `pnpm-lock.yaml` is committed for reproducible installs
