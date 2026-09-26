# src/cli.ts · [[cli-repl]] [[event-sourcing-core]]

- CliArgs · interface · L40-L44 — interface CliArgs
- parseArgs · function · L50-L74 — function parseArgs(args: string[]): CliArgs
- ProjectInfo · interface · L80-L85 — interface ProjectInfo
- detectProject · function · L87-L130 — async function detectProject(dir: string): Promise<ProjectInfo>
- HarnessComponents · interface · L136-L145 — interface HarnessComponents
- initializeHarness · function · L147-L643 — async function initializeHarness( projectDir: string, _projectInfo: ProjectInfo, ): Promise<HarnessComponents>
- invoke · method · L227-L273 — async invoke(request: ModelRequest): Promise<ModelResponse>
- stream · method · L274-L340 — async *stream(request: ModelRequest): AsyncIterable<StreamDelta>
- shellHandler · function · L347-L361 — shellHandler: ToolHandler<{ command: string }, string> = async ( params, _context: ToolContext, )
- gitHandler · function · L372-L384 — gitHandler: ToolHandler<{ command: string }, string> = async ( _params, _context: ToolContext, )
- fileHandler · function · L396-L450 — fileHandler: ToolHandler = async ( params, _context: ToolContext, )
- searchHandler · function · L469-L511 — searchHandler: ToolHandler = async ( params, _context: ToolContext, )
- githubHandler · function · L534-L615 — githubHandler: ToolHandler = async ( params, _context: ToolContext, )
- runRepl · function · L649-L744 — async function runRepl( components: HarnessComponents, projectInfo: ProjectInfo, projectDir: string, ): Promise<void>
- analyze · function · L750-L793 — async function analyze(projectDir: string, exportJson: boolean): Promise<void>
- main · function · L799-L827 — async function main(): Promise<void>
