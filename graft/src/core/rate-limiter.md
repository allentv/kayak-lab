# src/core/rate-limiter.ts · [[core-resilience-fault-tolerance]]

- TokenBucketConfig · interface · L9-L18 — interface TokenBucketConfig
- TokenBucket · class · L26-L109 — class TokenBucket
- constructor · method · L34-L40 — constructor(config: TokenBucketConfig)
- tryConsume · method · L46-L54 — tryConsume(tokens = 1): boolean
- waitAndConsume · method · L60-L65 — async waitAndConsume(tokens = 1): Promise<void>
- getAvailableTokens · method · L70-L73 — getAvailableTokens(): number
- startRefill · method · L78-L84 — startRefill(): void
- stopRefill · method · L89-L94 — stopRefill(): void
- refill · method · L99-L108 — private refill(): void
- RateLimiter · class · L119-L160 — class RateLimiter
- constructor · method · L122-L124 — constructor(bucket: TokenBucket)
- wrap · method · L130-L143 — wrap<T extends (...args: unknown[]) => Promise<unknown>>( fn: T, ): T
- limited · function · L135-L140 — limited = async (...args: unknown[])
- wrapWithWait · method · L148-L159 — wrapWithWait<T extends (...args: unknown[]) => Promise<unknown>>( fn: T, ): T
- limited · function · L153-L156 — limited = async (...args: unknown[])
