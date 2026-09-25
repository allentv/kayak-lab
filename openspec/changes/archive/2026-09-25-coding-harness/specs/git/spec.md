## Purpose

Git capability providing real version control operations via `Deno.Command` execution.

## MODIFIED Requirements

### Requirement: Git status

The git capability SHALL return real repository status.

#### Scenario: Get status
- **WHEN** `getStatus()` is called
- **THEN** the current branch, upstream, file changes, stash count, ahead/behind counts are returned from real git commands

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

The git capability SHALL return real commit history.

#### Scenario: Get history
- **WHEN** `getHistory(limit?)` is called
- **THEN** the last N commits (default 10) are returned with hash, author, date, and message

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
