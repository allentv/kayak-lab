# src/core/session-manager.ts · [[event-sourcing-session-lifecycle]]

Manages session lifecycle with event-sourcing, enforcing valid state transitions and coordinating with an event stream.

- SessionState · type · L20-L25 — Defines the possible states a session can be in throughout its lifecycle.
- Session · interface · L37-L44 — Represents a session with its metadata, state, and configuration.
- SessionError · class · L50-L55 — Base error class for session-related failures, extending the event stream error hierarchy.
- constructor · method · L51-L54 — Creates a session error with a message, code, and optional details.
- InvalidStateTransitionError · class · L57-L66 — Error thrown when attempting an illegal state transition for a session.
- constructor · method · L58-L65 — Creates an error describing an invalid state transition between specific session states.
- ISessionManager · interface · L72-L85 — Interface defining the contract for session lifecycle management operations.
- SessionManager · class · L96-L214 — Concrete implementation that manages sessions with event-sourcing and state transition validation.
- constructor · method · L99-L99 — Initializes the session manager with an event stream dependency.
- createSession · method · L101-L134 — Creates a new session with a unique ID, records its creation event, and returns an immutable copy.
- pauseSession · method · L136-L138 — Transitions a session to paused state if valid, recording the state change event.
- resumeSession · method · L140-L142 — Resumes a paused session back to active state, recording the state change event.
- completeSession · method · L144-L146 — Marks a session as completed, recording the state change event.
- failSession · method · L148-L152 — Marks a session as failed with an optional error message, recording the state change event.
- cancelSession · method · L154-L156 — Cancels a session, recording the state change event.
- getSession · method · L158-L161 — Retrieves a session by ID, returning an immutable copy if found.
- getSessions · method · L163-L165 — Returns immutable copies of all sessions currently managed.
- cloneSession · method · L170-L172 — Creates an immutable shallow copy of a session to preserve event-sourcing invariants.
- transition · method · L174-L213 — Core state transition logic that validates transitions, updates session state, and records events.
