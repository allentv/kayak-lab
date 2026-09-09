/**
 * Session attestation service for cost tracking and performance auditing.
 *
 * Aggregates model usage events and emits session.attestation events on completion.
 */

import { IEventStream } from "../core/event-stream.ts";
import { IEventStore } from "../store/event-store.ts";
import { BaseEvent, EventTypes } from "../types/events.ts";
import {
  AttestationEvent,
  AttestationFilter,
  ModelMetrics,
  ModelPricing,
  ProvenanceSummary,
} from "../types/attestations.ts";

// ============================================================================
// Attestation Service
// ============================================================================

/**
 * Service for creating and querying session attestations.
 */
export class AttestationService {
  private pricingConfig: Map<string, ModelPricing> = new Map();

  constructor(
    private readonly eventStream: IEventStream,
    private readonly eventStore: IEventStore,
  ) {}

  /**
   * Load pricing configuration.
   */
  loadPricing(pricing: ModelPricing[]): void {
    this.pricingConfig.clear();
    for (const p of pricing) {
      this.pricingConfig.set(`${p.provider}/${p.model_name}`, p);
    }
  }

  /**
   * Create attestation for a completed session.
   */
  async createAttestation(sessionId: string): Promise<AttestationEvent> {
    const events = this.eventStore.getEvents(sessionId);

    // Aggregate model usage
    const modelUsage = this.aggregateModelUsage(events);

    // Calculate costs
    const models: ModelMetrics[] = modelUsage.map((usage) => {
      const pricing = this.pricingConfig.get(`${usage.provider}/${usage.model_name}`);
      const cost = pricing
        ? usage.input_tokens * pricing.input_price_per_token +
          usage.output_tokens * pricing.output_price_per_token +
          usage.cache_read_tokens * pricing.cache_read_price_per_token +
          usage.cache_write_tokens * pricing.cache_write_price_per_token
        : null;

      return {
        model_name: usage.model_name,
        provider: usage.provider,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_read_tokens: usage.cache_read_tokens,
        cache_write_tokens: usage.cache_write_tokens,
        estimated_cost_usd: cost,
      };
    });

    // Calculate total cost
    const totalCost = models.reduce((sum, m) => {
      return sum + (m.estimated_cost_usd ?? 0);
    }, 0);

    // Count tool calls and model invocations
    const toolCalls = events.filter(
      (e: BaseEvent) => e.event_type === EventTypes.TOOL_EXECUTION_STARTED,
    );
    const modelInvocations = events.filter(
      (e: BaseEvent) => e.event_type === EventTypes.MODEL_REQUEST,
    );

    // Get provenance summary if available
    const provenanceSummary = this.extractProvenanceSummary(events);

    // Calculate duration
    const durationMs = this.calculateDuration(events);

    // Get file changes from provenance
    const fileChanges = this.extractFileChanges(events);

    // Create attestation
    const attestation: AttestationEvent = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      models,
      total_cost_usd: totalCost > 0 ? totalCost : null,
      total_tool_calls: toolCalls.length,
      total_model_invocations: modelInvocations.length,
      files_changed: fileChanges.files_changed,
      lines_added: fileChanges.lines_added,
      lines_removed: fileChanges.lines_removed,
      provenance_summary: provenanceSummary,
    };

    // Emit attestation event
    const attestationEvent = this.eventStream.append({
      session_id: sessionId,
      sequence_number: this.eventStream.getCurrentSequence(sessionId) + 1,
      event_type: EventTypes.SESSION_ATTESTATION,
      payload: attestation as unknown as Record<string, unknown>,
      metadata: { source: "attestation-service" },
    });

    // Store in event store for querying
    this.eventStore.store(attestationEvent);

    return attestation;
  }

  /**
   * Get attestation for a session.
   */
  async getAttestation(sessionId: string): Promise<AttestationEvent | null> {
    const events = this.eventStore.getEvents(sessionId);
    const attestationEvent = events.find(
      (e: BaseEvent) => e.event_type === EventTypes.SESSION_ATTESTATION,
    );

    if (!attestationEvent) {
      return null;
    }

    return attestationEvent.payload as unknown as AttestationEvent;
  }

  /**
   * Get attestations with optional filters.
   */
  async getAttestations(filter?: AttestationFilter): Promise<AttestationEvent[]> {
    const sessionIds = this.eventStore.getSessionIds();
    const attestations: AttestationEvent[] = [];

    for (const sessionId of sessionIds) {
      if (filter?.sessionId && sessionId !== filter.sessionId) {
        continue;
      }

      const attestation = await this.getAttestation(sessionId);
      if (attestation) {
        attestations.push(attestation);
      }
    }

    // Sort
    if (filter?.sortBy) {
      attestations.sort((a, b) => {
        let comparison = 0;
        switch (filter.sortBy) {
          case "cost":
            comparison = (a.total_cost_usd ?? 0) - (b.total_cost_usd ?? 0);
            break;
          case "duration":
            comparison = a.duration_ms - b.duration_ms;
            break;
          case "date":
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
        }
        return filter.sortOrder === "desc" ? -comparison : comparison;
      });
    }

    // Apply limit and offset
    const start = filter?.offset ?? 0;
    const end = filter?.limit ? start + filter.limit : undefined;
    return attestations.slice(start, end);
  }

  /**
   * Aggregate model usage from events.
   */
  private aggregateModelUsage(events: readonly BaseEvent[]): Array<{
    model_name: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
  }> {
    const usageMap = new Map<
      string,
      {
        model_name: string;
        provider: string;
        input_tokens: number;
        output_tokens: number;
        cache_read_tokens: number;
        cache_write_tokens: number;
      }
    >();

    for (const event of events) {
      if (event.event_type === EventTypes.MODEL_RESPONSE) {
        const payload = event.payload as Record<string, unknown>;
        const usage = payload.usage as Record<string, unknown> | undefined;
        const model = (payload.model as string) ?? "unknown";
        const provider = (payload.provider as string) ?? "unknown";

        if (!usage) continue;

        const key = `${provider}/${model}`;
        const existing = usageMap.get(key) ?? {
          model_name: model,
          provider,
          input_tokens: 0,
          output_tokens: 0,
          cache_read_tokens: 0,
          cache_write_tokens: 0,
        };

        existing.input_tokens += ((usage.prompt_tokens as number) ?? 0);
        existing.output_tokens += ((usage.completion_tokens as number) ?? 0);
        existing.cache_read_tokens += ((usage.cache_read_tokens as number) ?? 0);
        existing.cache_write_tokens += ((usage.cache_write_tokens as number) ?? 0);

        usageMap.set(key, existing);
      }
    }

    return Array.from(usageMap.values());
  }

  /**
   * Extract provenance summary from events.
   */
  private extractProvenanceSummary(events: readonly BaseEvent[]): ProvenanceSummary {
    // Count provenance node types from provenance graph events
    let totalGoals = 0;
    let totalExplorations = 0;
    let totalCommitments = 0;
    let totalVerifications = 0;

    for (const event of events) {
      // Look for provenance node creation in metadata
      const metadata = event.metadata as Record<string, unknown>;
      if (metadata.provenance_node_type) {
        const nodeType = metadata.provenance_node_type as string;

        switch (nodeType) {
          case "goal":
            totalGoals++;
            break;
          case "exploration":
            totalExplorations++;
            break;
          case "commitment":
            totalCommitments++;
            break;
          case "verification":
            totalVerifications++;
            break;
        }
      }
    }

    const ratio = totalCommitments > 0
      ? totalExplorations / totalCommitments
      : 0;

    return {
      total_goals: totalGoals,
      total_explorations: totalExplorations,
      total_commitments: totalCommitments,
      total_verifications: totalVerifications,
      exploration_to_commitment_ratio: ratio,
    };
  }

  /**
   * Calculate session duration from events.
   */
  private calculateDuration(events: readonly BaseEvent[]): number {
    if (events.length === 0) return 0;

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    const startTime = new Date(firstEvent.timestamp).getTime();
    const endTime = new Date(lastEvent.timestamp).getTime();

    return endTime - startTime;
  }

  /**
   * Extract file changes from events.
   */
  private extractFileChanges(events: readonly BaseEvent[]): {
    files_changed: number;
    lines_added: number;
    lines_removed: number;
  } {
    let filesChanged = 0;
    let linesAdded = 0;
    let linesRemoved = 0;

    for (const event of events) {
      if (event.event_type === EventTypes.TOOL_EXECUTION_COMPLETED) {
        const payload = event.payload as Record<string, unknown>;
        if (payload.files_changed) {
          filesChanged += ((payload.files_changed as number) ?? 0);
        }
        if (payload.lines_added) {
          linesAdded += ((payload.lines_added as number) ?? 0);
        }
        if (payload.lines_removed) {
          linesRemoved += ((payload.lines_removed as number) ?? 0);
        }
      }
    }

    return { files_changed: filesChanged, lines_added: linesAdded, lines_removed: linesRemoved };
  }
}
