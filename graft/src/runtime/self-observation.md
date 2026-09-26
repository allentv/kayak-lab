# src/runtime/self-observation.ts · [[runtime-orchestration]] [[self-observation-and-pattern-detection]]

- ObservationContext · interface · L16-L25 — interface ObservationContext
- ISelfObservation · interface · L28-L35 — interface ISelfObservation
- PatternDetection · interface · L38-L43 — interface PatternDetection
- SelfObservation · class · L49-L134 — class SelfObservation implements ISelfObservation
- constructor · method · L50-L53 — constructor( private readonly queryEngine: IEventQueryEngine, private readonly eventStream: IEventStream, )
- preTurn · method · L55-L66 — async preTurn(sessionId: string): Promise<ObservationContext>
- postTurn · method · L68-L101 — async postTurn(sessionId: string, context: ObservationContext): Promise<void>
- detectPatterns · method · L103-L133 — async detectPatterns(sessionId: string): Promise<PatternDetection[]>
