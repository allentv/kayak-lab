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

#### Scenario: Not a git repository
- **WHEN** `getStatus()` is called outside a git repository
- **THEN** an error is returned indicating not a git repository

### Requirement: Git changes

The git capability SHALL return real file changes.

#### Scenario: Get changes
- **WHEN** `getChanges()` is called
- **THEN** all modified, staged, untracked, deleted, renamed, and copied files are returned with their status

### Requirement: Git staging

The git capability SHALL stage and unstage files.

#### Scenario: Stage files
- **WHEN** `stage(paths)` is called with file paths
- **THEN** `git add <paths>` is executed

#### Scenario: Unstage files
- **WHEN** `unstage(paths)` is called with file paths
- **THEN** `git reset HEAD <paths>` is executed

### Requirement: Git commit

The git capability SHALL create real commits.

#### Scenario: Commit changes
- **WHEN** `commit(message)` is called
- **THEN** `git commit -m "<message>"` is executed and the new commit hash, author, date, and message are returned

#### Scenario: Nothing to commit
- **WHEN** `commit(message)` is called with no staged changes
- **THEN** an error is returned indicating nothing to commit

### Requirement: Git history

The Git capability MUST return real commit history from `git log`.

#### Scenario: Get commit history
- **WHEN** `getHistory(limit)` is called
- **THEN** `git log --oneline -n <limit>` is executed and commits are returned with real hashes, authors, dates, and messages

### Requirement: Git branches

The git capability SHALL manage branches.

#### Scenario: List branches
- **WHEN** `getBranches()` is called
- **THEN** all local branches are returned with current branch marked

#### Scenario: Create branch
- **WHEN** `createBranch(name)` is called
- **THEN** `git branch <name>` is executed

#### Scenario: Switch branch
- **WHEN** `switchBranch(name)` is called
- **THEN** `git checkout <name>` is executed

### Requirement: Git diff

The git capability SHALL show diffs.

#### Scenario: Get diff
- **WHEN** `getDiff(path?)` is called
- **THEN** `git diff [path]` is executed and the diff output is returned

#### Scenario: Get staged diff
- **WHEN** `getDiff({ staged: true })` is called
- **THEN** `git diff --cached` is executed

### Requirement: Git push/pull

The git capability SHALL push and pull changes.

#### Scenario: Push changes
- **WHEN** `push(remote?, branch?)` is executed
- **THEN** `git push [remote] [branch]` is executed

#### Scenario: Pull changes
- **WHEN** `pull(remote?, branch?)` is executed
- **THEN** `git pull [remote] [branch]` is executed
