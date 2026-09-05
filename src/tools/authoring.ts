/**
 * Tool authoring TUI.
 *
 * Interactive interface for dynamic tool creation that presents background
 * information to help users make informed decisions about tool design,
 * with accept/reject/modify flow.
 */

import type { IToolDefinition, ToolHandler } from "./types.ts";
import type { IToolRegistry } from "./registry.ts";

// ============================================================================
// Types
// ============================================================================

/** Outcome of a tool authoring decision. */
export type AuthoringDecision =
  | { action: "accept"; definition: IToolDefinition; handler: ToolHandler }
  | { action: "modify"; definition: IToolDefinition; handler: ToolHandler }
  | { action: "reject"; reason: string };

/** Context explaining why a tool is needed. */
export interface ProposalContext {
  /** What the agent is currently trying to do. */
  current_task: string;
  /** Why existing tools don't suffice. */
  gap_description: string;
  /** Example usage scenarios. */
  examples: string[];
}

/** A tool proposal presented to the user. */
export interface ToolProposal {
  /** Proposed tool definition. */
  definition: IToolDefinition;
  /** Why this tool is needed. */
  context: ProposalContext;
  /** Timestamp of proposal. */
  proposed_at: number;
}

// ============================================================================
// Events
// ============================================================================

/** Events emitted by the authoring system. */
export interface ToolAuthoringEvents {
  onToolProposed?: (proposal: ToolProposal, timestamp: number) => void;
  onToolCreated?: (toolName: string, timestamp: number) => void;
  onToolRejected?: (toolName: string, reason: string, timestamp: number) => void;
}

// ============================================================================
// Interface
// ============================================================================

/**
 * Interface for tool authoring operations.
 */
export interface IToolAuthoring {
  /** Propose a new tool for creation. */
  propose(definition: IToolDefinition, context: ProposalContext): ToolProposal;
  /** Handle user decision on a proposal. */
  decide(proposal: ToolProposal, decision: AuthoringDecision): void;
  /** List pending proposals. */
  pending(): ToolProposal[];
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Manages tool authoring workflow: proposal, decision, and registration.
 */
export class ToolAuthoring implements IToolAuthoring {
  private proposals: ToolProposal[] = [];
  private registry: IToolRegistry;
  private events: ToolAuthoringEvents;

  constructor(registry: IToolRegistry, events?: ToolAuthoringEvents) {
    this.registry = registry;
    this.events = events ?? {};
  }

  propose(definition: IToolDefinition, context: ProposalContext): ToolProposal {
    const proposal: ToolProposal = {
      definition,
      context,
      proposed_at: Date.now(),
    };
    this.proposals.push(proposal);
    this.events.onToolProposed?.(proposal, proposal.proposed_at);
    return proposal;
  }

  decide(proposal: ToolProposal, decision: AuthoringDecision): void {
    // Remove from pending
    const idx = this.proposals.indexOf(proposal);
    if (idx >= 0) {
      this.proposals.splice(idx, 1);
    }

    const now = Date.now();

    switch (decision.action) {
      case "accept": {
        const def = decision.definition;
        this.registry.register(def, decision.handler);
        this.events.onToolCreated?.(def.name, now);
        break;
      }
      case "modify": {
        const def = decision.definition;
        // Unregister old version if it exists, then register modified version
        if (this.registry.has(proposal.definition.name)) {
          this.registry.unregister(proposal.definition.name);
        }
        this.registry.register(def, decision.handler);
        this.events.onToolCreated?.(def.name, now);
        break;
      }
      case "reject": {
        this.events.onToolRejected?.(
          proposal.definition.name,
          decision.reason,
          now,
        );
        break;
      }
    }
  }

  pending(): ToolProposal[] {
    return [...this.proposals];
  }
}
