# src/memory/message-classifier.ts · [[memory-system]] [[provenance-aware-context-pruning]]

Message classification and scoring module that assigns priority and provenance-based outcome scores to messages for context management.

- MessageClassifier · class · L30-L272 — Classifies messages by role/content heuristics and scores them based on provenance graph outcomes for context prioritization.
- setProvenanceGraph · method · L34-L36 — Sets the provenance graph reference for outcome-based scoring of messages.
- getProvenanceGraph · method · L39-L41 — Retrieves the current provenance graph reference for inspection.
- isGraphSufficient · method · L47-L49 — Checks if the provenance graph has enough nodes (≥3) for meaningful outcome scoring.
- scoreMessage · method · L54-L56 — Computes total message score by combining base priority with provenance outcome bonus.
- getBasePriority · method · L65-L87 — Assigns base priority to messages based on role and content heuristics (system, goal, commitment, verification, exploration).
- isGoalMessage · method · L93-L98 — Identifies goal-oriented user messages by checking for 'goal:', 'task:', or 'request:' prefixes.
- isCommitmentMessage · method · L104-L112 — Detects commitment messages from tool results containing write/edit/create/delete/applied keywords.
- isVerificationMessage · method · L118-L126 — Identifies verification messages from tool results with exit codes, test outputs, or verification keywords.
- isExplorationMessage · method · L132-L139 — Detects exploration messages from tool results of read-only operations like reading or searching.
- getOutcomeScore · method · L148-L171 — Calculates provenance outcome score for a message based on its linked node's success, failure, or dead-end status.
- findNodeForMessage · method · L177-L179 — Placeholder for finding provenance node linked to a message (not yet implemented).
- isSuccessfulOutcome · method · L184-L196 — Checks if a provenance node is linked to successful outcomes via child verification nodes with exit code 0.
- isFailedOutcome · method · L201-L213 — Checks if a provenance node is linked to failed outcomes via child verification nodes with non-zero exit codes.
- isDeadEnd · method · L218-L227 — Determines if a provenance node is a dead end by checking for descendant commitment or verification nodes.
- getChildNodes · method · L236-L243 — Retrieves child nodes of a given node from provenance graph edges.
- hasDescendantOfType · method · L248-L271 — Performs BFS to check if a node has descendants of specified provenance node types.
