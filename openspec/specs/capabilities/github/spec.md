# github Specification

## Purpose

GitHub API capability with real REST API calls. Provides authenticated access to GitHub issues, pull requests, and repository operations.

## Requirements

### Requirement: GitHub authentication

The GitHub capability MUST authenticate using a personal access token provided via context or environment variable.

#### Scenario: Token provided
- **WHEN** the capability is initialized with a GitHub token
- **THEN** all API requests include `Authorization: Bearer <token>` header

#### Scenario: Missing token
- **WHEN** no token is available
- **THEN** the capability returns an authentication error

### Requirement: GitHub issues

The GitHub capability MUST execute real GitHub issue operations.

#### Scenario: List issues
- **WHEN** `listIssues(options)` is called
- **THEN** `GET /repos/{owner}/{repo}/issues` is called with appropriate query parameters and real issues are returned

#### Scenario: Create issue
- **WHEN** `createIssue(issue)` is called
- **THEN** `POST /repos/{owner}/{repo}/issues` is called and the real created issue is returned

### Requirement: GitHub pull requests

The GitHub capability MUST execute real GitHub pull request operations.

#### Scenario: List pull requests
- **WHEN** `listPullRequests(options)` is called
- **THEN** `GET /repos/{owner}/{repo}/pulls` is called and real PRs are returned

#### Scenario: Merge pull request
- **WHEN** `mergePullRequest(number, options)` is called
- **THEN** `PUT /repos/{owner}/{repo}/pulls/{number}/merge` is called with the specified merge method
