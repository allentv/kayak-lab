/**
 * Session attestation types for cost tracking and performance auditing.
 */

// ============================================================================
// Attestation Types
// ============================================================================

/** Model-specific metrics in an attestation. */
export interface ModelMetrics {
  model_name: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  estimated_cost_usd: number | null;
}

/** Provenance summary in an attestation. */
export interface ProvenanceSummary {
  total_goals: number;
  total_explorations: number;
  total_commitments: number;
  total_verifications: number;
  exploration_to_commitment_ratio: number;
}

/** Session attestation event payload. */
export interface AttestationEvent {
  session_id: string;
  timestamp: string; // ISO 8601 timestamp
  duration_ms: number;
  models: ModelMetrics[];
  total_cost_usd: number | null;
  total_tool_calls: number;
  total_model_invocations: number;
  files_changed: number;
  lines_added: number;
  lines_removed: number;
  provenance_summary: ProvenanceSummary;
  previous_attestation?: string; // session_id of previous attestation if resumed
}

/** Filter options for querying attestations. */
export interface AttestationFilter {
  sessionId?: string;
  sortBy?: "cost" | "duration" | "date";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// ============================================================================
// Pricing Types
// ============================================================================

/** Pricing data for a model. */
export interface ModelPricing {
  model_name: string;
  provider: string;
  input_price_per_token: number;
  output_price_per_token: number;
  cache_read_price_per_token: number;
  cache_write_price_per_token: number;
}

/** Pricing configuration. */
export interface PricingConfig {
  models: ModelPricing[];
}
