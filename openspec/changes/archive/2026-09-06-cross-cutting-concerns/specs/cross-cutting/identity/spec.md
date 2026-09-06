## Purpose

Identity and access management for the agent platform. Provides user authentication, session-level identity propagation, and role-based access control for capabilities.

## ADDED Requirements

### Requirement: User identity

Every agent session MUST be associated with an authenticated user identity.

#### Scenario: Session creation with identity
- **WHEN** a new session is created
- **THEN** the creating user's identity (user_id, roles) is attached to the session

#### Scenario: Identity propagation
- **WHEN** events are emitted during a session
- **THEN** the user identity is included in event metadata

### Requirement: Authentication

The system MUST authenticate users before allowing session creation.

#### Scenario: Token-based auth
- **WHEN** a user provides a valid authentication token
- **THEN** the token is validated and the user identity is extracted

#### Scenario: Invalid token
- **WHEN** a user provides an invalid or expired token
- **THEN** the request is rejected with 401 Unauthorized

#### Scenario: No token
- **WHEN** no authentication token is provided
- **THEN** the request is rejected (anonymous access is not permitted)

### Requirement: Authorization

The system MUST enforce role-based access control for capabilities.

#### Scenario: Authorized capability access
- **WHEN** a user with role `admin` requests a capability
- **THEN** the capability is executed

#### Scenario: Unauthorized capability access
- **WHEN** a user without the required role requests a capability
- **THEN** the request is rejected with 403 Forbidden

#### Scenario: Capability role mapping
- **WHEN** a capability requires a specific role
- **THEN** the requirement is defined in the capability's metadata
