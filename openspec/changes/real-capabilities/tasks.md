## 1. Git Capability

- [ ] 1.1 Implement `GitCapability.execute()` private method that runs `Deno.Command` for git commands with `--porcelain` output. Verify: method compiles and executes git commands.
- [ ] 1.2 Implement real `getStatus()` using `git status --porcelain -b`. Parse output into `GitStatus` with branch, tracking info, and file changes. Verify: run on a real repo, returns correct branch and changes.
- [ ] 1.3 Implement real `stage(paths)` using `git add <paths>`. Verify: stage a file, `git status` shows it as staged.
- [ ] 1.4 Implement real `unstage(paths)` using `git reset HEAD <paths>`. Verify: unstage a file, `git status` shows it as unstaged.
- [ ] 1.5 Implement real `commit(message)` using `git commit -m <message>`. Parse output for commit hash. Verify: commit created, hash returned matches `git log`.
- [ ] 1.6 Implement real `getHistory(limit)` using `git log --oneline -n <limit>`. Parse output into `GitCommit[]`. Verify: returns real commits with hashes, authors, dates.
- [ ] 1.7 Implement real `getBranches()` using `git branch -a`. Verify: returns all branches including remote.
- [ ] 1.8 Implement real `createBranch(name)` and `switchBranch(name)`. Verify: branch created and switched.

## 2. GitHub Capability

- [ ] 2.1 Implement `GitHubCapability.request()` private method for authenticated GitHub REST API calls using `fetch`. Handle auth errors, rate limiting, network failures. Verify: method compiles, handles errors.
- [ ] 2.2 Implement real `getRepository()` using `GET /repos/{owner}/{repo}`. Verify: returns real repo info.
- [ ] 2.3 Implement real `listIssues(options)` using `GET /repos/{owner}/{repo}/issues` with query params. Verify: returns real issues.
- [ ] 2.4 Implement real `createIssue(issue)` using `POST /repos/{owner}/{repo}/issues`. Verify: issue created on GitHub.
- [ ] 2.5 Implement real `updateIssue(number, update)` using `PATCH /repos/{owner}/{repo}/issues/{number}`. Verify: issue updated.
- [ ] 2.6 Implement real `listPullRequests(options)` using `GET /repos/{owner}/{repo}/pulls`. Verify: returns real PRs.
- [ ] 2.7 Implement real `createPullRequest(pr)` using `POST /repos/{owner}/{repo}/pulls`. Verify: PR created.
- [ ] 2.8 Implement real `mergePullRequest(number, options)` using `PUT /repos/{owner}/{repo}/pulls/{number}/merge`. Verify: PR merged.
- [ ] 2.9 Implement real `listIssueComments()` and `createIssueComment()`. Verify: comments retrievable and creatable.

## 3. Kubernetes Capability

- [ ] 3.1 Implement `KubernetesCapability.request()` private method for authenticated K8s API calls. Support in-cluster and kubeconfig auth. Verify: method compiles, handles auth.
- [ ] 3.2 Implement real `listPods(namespace)` using `GET /api/v1/namespaces/{namespace}/pods`. Verify: returns real pod data.
- [ ] 3.3 Implement real `getDeploymentStatus(name, namespace)` using `GET /apis/apps/v1/namespaces/{namespace}/deployments/{name}`. Verify: returns real deployment status.
- [ ] 3.4 Implement real `listEvents(namespace)` using `GET /api/v1/namespaces/{namespace}/events`. Verify: returns real events.
- [ ] 3.5 Implement real `listServices(namespace)` and `listDeployments(namespace)`. Verify: returns real resource lists.

## 4. Tests

- [ ] 4.1 Write Git capability tests using a temporary git repo created in test setup. Verify: all git operations work against real repo.
- [ ] 4.2 Write GitHub capability tests using a mock HTTP server (Deno std lib) that simulates GitHub API responses. Verify: all API calls parsed correctly.
- [ ] 4.3 Write Kubernetes capability tests using a mock HTTP server that simulates K8s API responses. Verify: all API calls parsed correctly.
- [ ] 4.4 Verify existing 112+ tests still pass with updated capabilities. Verify: `deno test` passes.
