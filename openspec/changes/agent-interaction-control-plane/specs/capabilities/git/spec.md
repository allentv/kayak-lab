## Purpose

Git operations capability with abstract interface. Provides version control operations without exposing Git-specific implementation details.

## ADDED Requirements

### Requirement: Git operations

The Git capability MUST provide abstract interfaces for common version control operations.

#### Scenario: Repository status
- **WHEN** the agent requests repository status
- **THEN** the capability returns current branch, modified files, and staging status

#### Scenario: File changes
- **WHEN** the agent requests file changes
- **THEN** the capability returns added, modified, and deleted files with diffs

#### Scenario: Commit operations
- **WHEN** the agent commits changes
- **THEN** the capability creates a commit with the specified message and files

### Requirement: Provider independence

The Git capability MUST NOT expose Git-specific implementation details.

#### Scenario: Abstract interface
- **WHEN** the agent invokes Git operations
- **THEN** the interface uses abstract terms (repository, branch, commit) not Git-specific terms

#### Scenario: Configuration abstraction
- **WHEN** Git is configured
- **THEN** the configuration uses abstract terms (remote URL, authentication) not Git-specific config
