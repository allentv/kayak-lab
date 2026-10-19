## Purpose

Platform-agnostic file system operations: read, write, watch. Replaces `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.watchFs`.

## ADDED Requirements

### Requirement: File read/write via abstraction

The system MUST provide async text file read and write operations.

#### Scenario: Read text file

- **WHEN** code reads a text file via the abstraction
- **THEN** the file contents are returned as a string

#### Scenario: Write text file

- **WHEN** code writes a text file via the abstraction
- **THEN** the file is created or overwritten with the provided content

### Requirement: File watching via abstraction

The system MUST provide filesystem watching that emits events on file changes.

#### Scenario: Watch directory for changes

- **WHEN** code starts watching a directory
- **THEN** file create/modify/delete events are delivered asynchronously

#### Scenario: Stop watching

- **WHEN** code stops the watcher
- **THEN** no further events are emitted and resources are released

### Requirement: Runtime adapter is swappable

File system operations MUST have Deno and Node.js implementations with identical observable behavior.

#### Scenario: Deno adapter uses Deno file APIs

- **WHEN** running on Deno
- **THEN** the adapter delegates to `Deno.readTextFile`, `Deno.writeTextFile`, `Deno.watchFs`

#### Scenario: Node adapter uses node:fs/promises

- **WHEN** running on Node.js
- **THEN** the adapter delegates to `node:fs/promises` and `fs.watch`
