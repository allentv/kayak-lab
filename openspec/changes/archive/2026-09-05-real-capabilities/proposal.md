## Why

The Git, GitHub, and Kubernetes capabilities are currently stubbed with simulated data. Only Shell has real execution. For the platform to be useful, these capabilities must execute real operations against actual systems.

## What Changes

Replace stubbed capability implementations with real execution:

- **Git**: Execute real git commands via `Deno.Command` — status, add, commit, log, branch, diff
- **GitHub**: Call the GitHub REST API via `fetch` — issues, pull requests, repository info, comments
- **Kubernetes**: Call the Kubernetes API via `fetch` — list/get pods, deployments, services, events

### Modified Capabilities

- `capabilities/git`: Replace simulated data with real `git` CLI execution
- `capabilities/github`: Replace simulated data with real GitHub REST API calls
- `capabilities/kubernetes`: Replace simulated data with real Kubernetes API calls

## Capabilities

### Modified Capabilities

- `capabilities/git`: Real git operations via Deno.Command
- `capabilities/github`: Real GitHub REST API operations via fetch
- `capabilities/kubernetes`: Real Kubernetes API operations via fetch
