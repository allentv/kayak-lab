## Purpose

GitHub capability providing real GitHub API operations via REST API calls.

## MODIFIED Requirements

### Requirement: GitHub authentication

The github capability SHALL authenticate using a personal access token.

#### Scenario: Token from environment
- **WHEN** the capability is initialized
- **THEN** it reads `GITHUB_TOKEN` from environment variables

#### Scenario: Missing token
- **WHEN** `GITHUB_TOKEN` is not set
- **THEN** an error is returned indicating authentication is required

### Requirement: Repository operations

The github capability SHALL interact with GitHub repositories.

#### Scenario: Get repository info
- **WHEN** `getRepository(owner, repo)` is called
- **THEN** repository metadata (name, description, stars, forks, language) is returned from the GitHub API

#### Scenario: List repositories
- **WHEN** `listRepositories(owner?)` is called
- **THEN** repositories for the authenticated user or specified owner are returned

### Requirement: Issue operations

The github capability SHALL manage GitHub issues.

#### Scenario: List issues
- **WHEN** `listIssues(owner, repo, options?)` is called
- **THEN** issues are returned with number, title, state, author, labels, and created date

#### Scenario: Get issue
- **WHEN** `getIssue(owner, repo, number)` is called
- **THEN** the issue details including body, comments, and labels are returned

#### Scenario: Create issue
- **WHEN** `createIssue(owner, repo, title, body?, labels?)` is called
- **THEN** a new issue is created and the issue number and URL are returned

#### Scenario: Update issue
- **WHEN** `updateIssue(owner, repo, number, updates)` is called
- **THEN** the issue is updated with the provided fields

### Requirement: Pull request operations

The github capability SHALL manage GitHub pull requests.

#### Scenario: List pull requests
- **WHEN** `listPullRequests(owner, repo, options?)` is called
- **THEN** PRs are returned with number, title, state, author, branches, and created date

#### Scenario: Get pull request
- **WHEN** `getPullRequest(owner, repo, number)` is called
- **THEN** PR details including body, commits, files changed, and review status are returned

#### Scenario: Create pull request
- **WHEN** `createPullRequest(owner, repo, title, head, base, body?)` is called
- **THEN** a new PR is created and the PR number and URL are returned

### Requirement: GitHub Actions

The github capability SHALL query GitHub Actions workflows.

#### Scenario: List workflows
- **WHEN** `listWorkflows(owner, repo)` is called
- **THEN** workflows are returned with name, state, and last run status

#### Scenario: Get workflow runs
- **WHEN** `getWorkflowRuns(owner, repo, workflowId?)` is called
- **THEN** recent workflow runs are returned with status, conclusion, and timing

### Requirement: Rate limiting

The github capability SHALL handle API rate limits.

#### Scenario: Rate limit exceeded
- **WHEN** a GitHub API call returns 403 with rate limit headers
- **THEN** an error is returned with the reset time and remaining quota
