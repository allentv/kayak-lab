## Context

The capability layer defines abstract interfaces for Git, GitHub, and Kubernetes. Shell (`src/capabilities/shell.ts`) already has a real implementation using `Deno.Command`. Git, GitHub, and K8s have the same interfaces but return simulated data. The pattern from Shell provides the template.

## Goals / Non-Goals

**Goals:**
- Replace simulated Git/GitHub/K8s implementations with real execution
- Maintain the existing `ICapability` interface contract
- Follow the Shell capability pattern (Deno.Command for CLI, fetch for APIs)
- Add proper error handling for network failures, auth errors, command failures

**Non-Goals:**
- Building a full Git library (just CLI wrapper)
- Full Octokit integration (just REST API calls)
- Full K8s client library (just REST API calls)
- Caching or offline support

## Decisions

### 1. Deno.Command for Git

**Decision:** Use `Deno.Command` to execute git CLI commands, same pattern as Shell capability.

**Rationale:**
- Git CLI is universally available and well-documented
- Output parsing is straightforward (use `--porcelain` for machine-readable output)
- No external dependencies needed
- Follows the established Shell capability pattern

**Alternatives considered:**
- isomorphic-git library: Adds dependency, less flexible than CLI
- simple-git library: Node-focused, Deno compatibility uncertain

### 2. Native fetch for GitHub API

**Decision:** Use Deno's built-in `fetch` for GitHub REST API calls.

**Rationale:**
- No external dependencies needed
- GitHub REST API is well-documented and stable
- Token-based auth is simple (Bearer header)
- Full control over error handling and response parsing

**Alternatives considered:**
- Octokit: Adds dependency, more features than needed
- GraphQL API: More powerful but more complex; REST is sufficient

### 3. Native fetch for Kubernetes API

**Decision:** Use Deno's built-in `fetch` for Kubernetes API calls.

**Rationale:**
- Same benefits as GitHub API approach
- K8s API is REST-based with well-documented endpoints
- In-cluster auth is just reading files/env vars

**Alternatives considered:**
- @kubernetes/client-node: Node-focused, heavy dependency
- Deno third-party K8s client: Uncertain maintenance status

## Risks / Trade-offs

### Risk: Git output parsing

**Impact:** Medium — git output format varies by version and locale.

**Mitigation:** Use `--porcelain` flags for machine-readable output. Set `LC_ALL=C` for consistent locale.

### Risk: GitHub API rate limiting

**Impact:** Low — 5000 requests/hour for authenticated users. Agent interactions are low-frequency.

**Mitigation:** Return clear error on 403/429. Future: add retry with backoff.

### Risk: Kubernetes API access

**Impact:** Medium — requires proper RBAC permissions in-cluster.

**Mitigation:** Clear error messages on 401/403. Document required permissions.
