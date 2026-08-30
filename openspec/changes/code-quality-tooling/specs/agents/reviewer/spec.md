## MODIFIED Requirements

### REQ-REVIEW-01: Pre-review static analysis

The reviewer agent MUST run static analysis before proceeding with code review.

**Acceptance Criteria:**
- `deno task check` runs first — review stops if it fails
- `deno lint` runs second — review stops if it fails
- `deno task test` runs third — review stops if it fails
- Only if all three pass does the reviewer proceed with code analysis
