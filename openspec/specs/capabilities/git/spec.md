# git Specification

## Purpose

Real Git operations executed via the system git CLI. Provides version control operations with full access to repository status, staging, committing, branching, and history.

## Requirements

### Requirement: Git status

The Git capability MUST return real repository status from `git status --porcelain`.

#### Scenario: Clean working tree
- **WHEN** `getStatus()` is called on a clean repository
- **THEN** the result shows the current branch, no changes, and tracking info from `git status`

#### Scenario: Dirty working tree
- **WHEN** `getStatus()` is called with modified files
- **THEN** the result lists each changed file with its status (modified, added, deleted, untracked)

### Requirement: Git stage and commit

The Git capability MUST execute real `git add` and `git commit` commands.

#### Scenario: Stage files
- **WHEN** `stage(paths)` is called
- **THEN** `git add <paths>` is executed and files are staged

#### Scenario: Commit staged changes
- **WHEN** `commit(message)` is called
- **THEN** `git commit -m <message>` is executed and the real commit hash, author, and date are returned

### Requirement: Git history

The Git capability MUST return real commit history from `git log`.

#### Scenario: Get commit history
- **WHEN** `getHistory(limit)` is called
- **THEN** `git log --oneline -n <limit>` is executed and commits are returned with real hashes, authors, dates, and messages
