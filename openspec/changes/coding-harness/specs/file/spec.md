## Purpose

File operations capability providing read, write, and edit functions for codebase interaction with safety constraints.

## ADDED Requirements

### Requirement: File read

The file capability SHALL read file contents with optional range selection.

#### Scenario: Read entire file
- **WHEN** `read(path)` is called on a text file
- **THEN** the full file content is returned as a string

#### Scenario: Read file range
- **WHEN** `read(path, { offset: 50, limit: 100 })` is called
- **THEN** lines 50-149 are returned (1-indexed, inclusive)

#### Scenario: Read binary file
- **WHEN** `read(path)` is called on a binary file (image, PDF, etc.)
- **THEN** the file is returned as a base64-encoded string with a mime type hint

#### Scenario: Read non-existent file
- **WHEN** `read(path)` is called on a file that doesn't exist
- **THEN** an error is returned with status 404

#### Scenario: Read directory
- **WHEN** `read(path)` is called on a directory
- **THEN** a listing of directory entries (files and subdirectories) is returned

### Requirement: File write

The file capability SHALL create or overwrite files with safety constraints.

#### Scenario: Write new file
- **WHEN** `write(path, content)` is called and the file doesn't exist
- **THEN** the file is created with the given content and the parent directories are created if needed

#### Scenario: Overwrite existing file
- **WHEN** `write(path, content)` is called on an existing file
- **THEN** the file is overwritten with the new content

#### Scenario: Write outside project directory
- **WHEN** `write(path, content)` is called with a path outside the project root
- **THEN** the operation is rejected with a security error

### Requirement: File edit

The file capability SHALL perform surgical string replacement in files.

#### Scenario: Edit existing file
- **WHEN** `edit(path, old_string, new_string)` is called with a unique match
- **THEN** the old_string is replaced with new_string in the file

#### Scenario: Edit with non-unique match
- **WHEN** `edit(path, old_string, new_string)` is called and old_string matches multiple locations
- **THEN** an error is returned indicating the match is not unique (unless replace_all is true)

#### Scenario: Edit with replace_all
- **WHEN** `edit(path, old_string, new_string, { replace_all: true })` is called
- **THEN** all occurrences of old_string are replaced with new_string

#### Scenario: Edit non-existent file
- **WHEN** `edit(path, old_string, new_string)` is called on a file that doesn't exist
- **THEN** an error is returned with status 404

#### Scenario: Edit with no match
- **WHEN** `edit(path, old_string, new_string)` is called and old_string is not found
- **THEN** an error is returned indicating the string was not found

### Requirement: Safety constraints

The file capability SHALL enforce safety constraints to prevent accidental damage.

#### Scenario: Path traversal protection
- **WHEN** a path contains `..` segments that escape the project root
- **THEN** the operation is rejected

#### Scenario: Symlink handling
- **WHEN** a path resolves to a symlink outside the project root
- **THEN** the operation is rejected

#### Scenario: Large file protection
- **WHEN** a read operation is attempted on a file larger than 10MB
- **THEN** the operation is rejected with a size limit error
