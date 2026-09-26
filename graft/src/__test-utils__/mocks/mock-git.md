# src/__test-utils__/mocks/mock-git.ts

- MockGitCapabilityConfig · interface · L19-L25 — interface MockGitCapabilityConfig
- MockGitCapability · class · L27-L163 — class MockGitCapability implements IGitCapability
- constructor · method · L39-L41 — constructor(config: MockGitCapabilityConfig = {})
- initialize · method · L43-L48 — async initialize(_context: CapabilityContext): Promise<void>
- dispose · method · L50-L52 — async dispose(): Promise<void>
- getStatus · method · L54-L66 — async getStatus(): Promise<CapabilityResult<GitStatus>>
- getChanges · method · L68-L74 — async getChanges(): Promise<CapabilityResult<GitFileChange[]>>
- stage · method · L76-L79 — async stage(_paths: string[]): Promise<CapabilityResult<void>>
- unstage · method · L81-L84 — async unstage(_paths: string[]): Promise<CapabilityResult<void>>
- commit · method · L86-L97 — async commit(_message: string): Promise<CapabilityResult<GitCommit>>
- getHistory · method · L99-L114 — async getHistory( _limit?: number, ): Promise<CapabilityResult<GitCommit[]>>
- getBranches · method · L116-L124 — async getBranches(): Promise<CapabilityResult<GitBranch[]>>
- createBranch · method · L126-L129 — async createBranch(_name: string): Promise<CapabilityResult<void>>
- switchBranch · method · L131-L134 — async switchBranch(_name: string): Promise<CapabilityResult<void>>
- getDiff · method · L136-L142 — async getDiff( _path?: string, _options?: { staged?: boolean }, ): Promise<CapabilityResult<string>>
- push · method · L144-L150 — async push( _remote?: string, _branch?: string, ): Promise<CapabilityResult<void>>
- pull · method · L152-L158 — async pull( _remote?: string, _branch?: string, ): Promise<CapabilityResult<void>>
- resetCalls · method · L160-L162 — resetCalls(): void
