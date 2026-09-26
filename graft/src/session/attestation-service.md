# src/session/attestation-service.ts · [[attestation-service]]

- AttestationService · class · L25-L328 — class AttestationService
- constructor · method · L28-L31 — constructor( private readonly eventStream: IEventStream, private readonly eventStore: IEventStore, )
- loadPricing · method · L36-L41 — loadPricing(pricing: ModelPricing[]): void
- createAttestation · method · L46-L123 — async createAttestation(sessionId: string): Promise<AttestationEvent>
- getAttestation · method · L128-L139 — async getAttestation(sessionId: string): Promise<AttestationEvent | null>
- getAttestations · method · L144-L182 — async getAttestations(filter?: AttestationFilter): Promise<AttestationEvent[]>
- aggregateModelUsage · method · L187-L236 — private aggregateModelUsage(events: readonly BaseEvent[]): Array<{ model_name: string; provider: string; input_tokens: number; output_tokens: number; cache_read_tokens: number; cache_write_tokens: number; }>
- extractProvenanceSummary · method · L241-L282 — private extractProvenanceSummary(events: readonly BaseEvent[]): ProvenanceSummary
- calculateDuration · method · L287-L297 — private calculateDuration(events: readonly BaseEvent[]): number
- extractFileChanges · method · L302-L327 — private extractFileChanges(events: readonly BaseEvent[]): { files_changed: number; lines_added: number; lines_removed: number; }
