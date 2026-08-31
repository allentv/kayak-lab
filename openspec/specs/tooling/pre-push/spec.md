## ADDED Requirements

### REQ-PUSH-01: Pre-push hook

The repository MUST include a git pre-push hook that runs static analysis before allowing pushes.

**Scenarios:**

- **Scenario: Clean code pushes**
  - GIVEN `deno task check` passes
  - AND `deno lint` passes
  - WHEN the developer runs `git push`
  - THEN the push proceeds

- **Scenario: Type errors block push**
  - GIVEN `deno task check` fails
  - WHEN the developer runs `git push`
  - THEN the push is blocked and errors are displayed

- **Scenario: Lint errors block push**
  - GIVEN `deno lint` fails
  - WHEN the developer runs `git push`
  - THEN the push is blocked and errors are displayed
