---
name: Profile Inheritance
slug: profile-inheritance
type: concept
sources:
  - path: src/runtime/__tests__/profile-registry.test.ts
    hash: 259047fbf2d9cac92929d9364733986dfa8bf889f4c412b0b2f06995f4b11ad4
  - path: src/runtime/profile-registry.ts
    hash: ef7fce9216ef969be07f84dfbba472408f15168e1cd8b1ea53fdb38d5b65e01b
  - path: src/runtime/profiles.ts
    hash: 637ecda8496a4e8b53d0c083c9e7371192ed8a06d6355646eca537e3078b1229
sources_digest: 2d148a74d8a45de28edac30845e497bc284742390ecc2312be4e05bd003bf2c8
links:
  - to: runtime-orchestration
    relation: part_of
    description: >-
      ProfileRegistry is used by SpawnConfigBuilder to resolve profiles; spawn
      function applies profile configurations to AgentRuntime.
generator:
  version: 1
---
<!-- context:generated:start -->
## Summary

Agent profiles support inheritance via 'extends' field, with child fields overriding parent fields. ProfileRegistry resolves chains and detects cycles. Built-in profiles (reviewer, scout, coder, quick) provide common defaults for tool sets, iteration limits, and temperature.

## Related

- part of [[runtime-orchestration]] — ProfileRegistry is used by SpawnConfigBuilder to resolve profiles; spawn function applies profile configurations to AgentRuntime.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
