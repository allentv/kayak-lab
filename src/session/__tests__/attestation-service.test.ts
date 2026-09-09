import { assertEquals, assertExists, assertAlmostEquals } from "@std/assert";
import { EventStore } from "../../store/event-store.ts";
import { EventStream } from "../../core/event-stream.ts";
import { AttestationService } from "../attestation-service.ts";
import { EventTypes, BaseEvent } from "../../types/events.ts";

Deno.test("AttestationService", async (t) => {
  await t.step("creates attestation from session events", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    // Create session
    const sessionId = "test-session-1";

    // Add model request event
    const requestEvent: BaseEvent = {
      event_id: "req-1",
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.MODEL_REQUEST,
      timestamp: new Date().toISOString(),
      schema_version: 1,
      payload: {
        messages: [],
        tools: [],
        model: "gpt-4",
        provider: "openai",
      },
      metadata: { source: "test" },
    };
    eventStore.store(requestEvent);

    // Add model response event
    const responseEvent: BaseEvent = {
      event_id: "res-1",
      session_id: sessionId,
      sequence_number: 2,
      event_type: EventTypes.MODEL_RESPONSE,
      timestamp: new Date().toISOString(),
      schema_version: 1,
      payload: {
        content: "Hello",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
        model: "gpt-4",
        provider: "openai",
      },
      metadata: { source: "test" },
    };
    eventStore.store(responseEvent);

    // Create attestation
    const attestation = await service.createAttestation(sessionId);

    assertExists(attestation);
    assertEquals(attestation.session_id, sessionId);
    assertEquals(attestation.models.length, 1);
    assertEquals(attestation.models[0].model_name, "gpt-4");
    assertEquals(attestation.models[0].input_tokens, 100);
    assertEquals(attestation.models[0].output_tokens, 50);
    assertEquals(attestation.total_model_invocations, 1);
  });

  await t.step("calculates cost with pricing", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    // Load pricing
    service.loadPricing([
      {
        model_name: "gpt-4",
        provider: "openai",
        input_price_per_token: 0.00003,
        output_price_per_token: 0.00006,
        cache_read_price_per_token: 0.000015,
        cache_write_price_per_token: 0.00003,
      },
    ]);

    const sessionId = "test-session-2";

    // Add model response event
    const responseEvent: BaseEvent = {
      event_id: "res-1",
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.MODEL_RESPONSE,
      timestamp: new Date().toISOString(),
      schema_version: 1,
      payload: {
        content: "Hello",
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
        },
        model: "gpt-4",
        provider: "openai",
      },
      metadata: { source: "test" },
    };
    eventStore.store(responseEvent);

    // Create attestation
    const attestation = await service.createAttestation(sessionId);

    assertExists(attestation);
    assertAlmostEquals(attestation.models[0].estimated_cost_usd!, 0.06, 0.0001); // (1000 * 0.00003) + (500 * 0.00006)
    assertAlmostEquals(attestation.total_cost_usd!, 0.06, 0.0001);
  });

  await t.step("returns null for missing pricing", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    const sessionId = "test-session-3";

    // Add model response event
    const responseEvent: BaseEvent = {
      event_id: "res-1",
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.MODEL_RESPONSE,
      timestamp: new Date().toISOString(),
      schema_version: 1,
      payload: {
        content: "Hello",
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
        },
        model: "unknown-model",
        provider: "unknown",
      },
      metadata: { source: "test" },
    };
    eventStore.store(responseEvent);

    // Create attestation
    const attestation = await service.createAttestation(sessionId);

    assertExists(attestation);
    assertEquals(attestation.models[0].estimated_cost_usd, null);
    assertEquals(attestation.total_cost_usd, null);
  });

  await t.step("gets attestation by session ID", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    const sessionId = "test-session-4";

    // Add model response event
    const responseEvent: BaseEvent = {
      event_id: "res-1",
      session_id: sessionId,
      sequence_number: 1,
      event_type: EventTypes.MODEL_RESPONSE,
      timestamp: new Date().toISOString(),
      schema_version: 1,
      payload: {
        content: "Hello",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
        },
        model: "gpt-4",
        provider: "openai",
      },
      metadata: { source: "test" },
    };
    eventStore.store(responseEvent);

    // Create attestation
    await service.createAttestation(sessionId);

    // Get attestation
    const attestation = await service.getAttestation(sessionId);

    assertExists(attestation);
    assertEquals(attestation.session_id, sessionId);
  });

  await t.step("returns null for non-existent attestation", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    const attestation = await service.getAttestation("non-existent");

    assertEquals(attestation, null);
  });

  await t.step("lists attestations with sorting", async () => {
    const eventStore = new EventStore();
    const eventStream = new EventStream();
    const service = new AttestationService(eventStream, eventStore);

    // Create multiple sessions with attestations
    for (let i = 1; i <= 3; i++) {
      const sessionId = `test-session-${i}`;

      const responseEvent: BaseEvent = {
        event_id: `res-${i}`,
        session_id: sessionId,
        sequence_number: 1,
        event_type: EventTypes.MODEL_RESPONSE,
        timestamp: new Date().toISOString(),
        schema_version: 1,
        payload: {
          content: "Hello",
          usage: {
            prompt_tokens: 100 * i,
            completion_tokens: 50 * i,
          },
          model: "gpt-4",
          provider: "openai",
        },
        metadata: { source: "test" },
      };
      eventStore.store(responseEvent);

      await service.createAttestation(sessionId);
    }

    // List attestations sorted by duration
    const attestations = await service.getAttestations({
      sortBy: "duration",
      sortOrder: "asc",
    });

    assertEquals(attestations.length, 3);
  });
});
