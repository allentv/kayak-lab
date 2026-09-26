# src/runtime/profile-registry.ts · [[profile-inheritance]] [[runtime-orchestration]]

- ProfileError · class · L13-L18 — class ProfileError extends Error
- constructor · method · L14-L17 — constructor(message: string)
- ProfileNotFoundError · class · L20-L25 — class ProfileNotFoundError extends ProfileError
- constructor · method · L21-L24 — constructor(name: string)
- ProfileCycleError · class · L27-L32 — class ProfileCycleError extends ProfileError
- constructor · method · L28-L31 — constructor(chain: string[])
- ProfileRegistry · class · L44-L119 — class ProfileRegistry
- register · method · L50-L52 — register(profile: AgentProfile): void
- unregister · method · L58-L60 — unregister(name: string): boolean
- get · method · L65-L67 — get(name: string): AgentProfile | undefined
- list · method · L72-L74 — list(): AgentProfile[]
- resolve · method · L87-L89 — resolve(name: string): AgentProfile
- resolveInternal · method · L91-L118 — private resolveInternal(name: string, chain: string[]): AgentProfile
