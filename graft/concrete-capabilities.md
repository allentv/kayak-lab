---
name: Concrete Capabilities
slug: concrete-capabilities
type: system
sources:
  - path: src/capabilities/file.ts
    hash: 0292b8e66e6f62428e731b04d716279127e1f05d4479edb88954bb8b37b6a335
  - path: src/capabilities/git.ts
    hash: a8a891abceab607e16e618f245c3853e8056a6d188afe5ac8259585f3e3cd37c
  - path: src/capabilities/github.ts
    hash: afc029aff2f6b9bcede2ddd7db2fd12b6a10e03378f2800e427d89b127db41f4
  - path: src/capabilities/kubernetes.ts
    hash: 3cc196b2c5f55b21caa8782c0e554c6e3bad3e0147d8cac26eb2893747b47136
  - path: src/capabilities/search.ts
    hash: cb266f3e0d35260bafeda011df1667b5ba4f3be663b12dee4e010a659436be22
  - path: src/capabilities/shell.ts
    hash: 7dbf1074634f8a2e15f9521a9adffaad2cd97aab2d6914a539140d2e7108b53b
sources_digest: e1b1019d4e0d3adf2dfac274147824ebd526694002ac5071a3353e2bc37919b4
links:
  - to: capability-framework
    relation: implements
    description: Each implements ICapability interface and registers via CapabilityRegistry
  - to: sandboxed-execution
    relation: depends_on
    description: >-
      SandboxedShellCapability uses ISandboxRuntime; FileCapability enforces
      sandbox root constraints
generator:
  version: 1
covers:
  - symbol: DirectoryEntry
    kind: interface
    at: 'src/capabilities/file.ts:L24-L27'
  - symbol: FileReadData
    kind: type
    at: 'src/capabilities/file.ts:L30-L33'
  - symbol: FileReadOptions
    kind: interface
    at: 'src/capabilities/file.ts:L36-L39'
  - symbol: FileEditOptions
    kind: interface
    at: 'src/capabilities/file.ts:L42-L44'
  - symbol: FileWriteData
    kind: interface
    at: 'src/capabilities/file.ts:L47-L50'
  - symbol: FileEditData
    kind: interface
    at: 'src/capabilities/file.ts:L52-L55'
  - symbol: IFileCapability
    kind: interface
    at: 'src/capabilities/file.ts:L64-L79'
  - symbol: toBase64
    kind: function
    at: 'src/capabilities/file.ts:L112-L120'
  - symbol: looksBinary
    kind: function
    at: 'src/capabilities/file.ts:L123-L128'
  - symbol: mimeTypeFor
    kind: function
    at: 'src/capabilities/file.ts:L130-L133'
  - symbol: FileCapability
    kind: class
    at: 'src/capabilities/file.ts:L138-L382'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/file.ts:L148-L151'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/file.ts:L153-L156'
  - symbol: read
    kind: method
    at: 'src/capabilities/file.ts:L158-L229'
  - symbol: write
    kind: method
    at: 'src/capabilities/file.ts:L231-L263'
  - symbol: edit
    kind: method
    at: 'src/capabilities/file.ts:L265-L322'
  - symbol: resolveWithinRoot
    kind: method
    at: 'src/capabilities/file.ts:L329-L334'
  - symbol: assertRealPathInsideRoot
    kind: method
    at: 'src/capabilities/file.ts:L340-L353'
  - symbol: getRealRoot
    kind: method
    at: 'src/capabilities/file.ts:L355-L365'
  - symbol: assertInside
    kind: method
    at: 'src/capabilities/file.ts:L367-L375'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/file.ts:L377-L381'
  - symbol: selectLines
    kind: function
    at: 'src/capabilities/file.ts:L392-L408'
  - symbol: FileStatus
    kind: type
    at: 'src/capabilities/git.ts:L20-L27'
  - symbol: GitFileChange
    kind: interface
    at: 'src/capabilities/git.ts:L30-L34'
  - symbol: GitBranch
    kind: interface
    at: 'src/capabilities/git.ts:L37-L42'
  - symbol: GitCommit
    kind: interface
    at: 'src/capabilities/git.ts:L45-L50'
  - symbol: GitStatus
    kind: interface
    at: 'src/capabilities/git.ts:L53-L60'
  - symbol: IGitCapability
    kind: interface
    at: 'src/capabilities/git.ts:L69-L105'
  - symbol: GitCapability
    kind: class
    at: 'src/capabilities/git.ts:L114-L481'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/git.ts:L123-L125'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/git.ts:L127-L129'
  - symbol: getStatus
    kind: method
    at: 'src/capabilities/git.ts:L131-L196'
  - symbol: getChanges
    kind: method
    at: 'src/capabilities/git.ts:L198-L206'
  - symbol: stage
    kind: method
    at: 'src/capabilities/git.ts:L208-L220'
  - symbol: unstage
    kind: method
    at: 'src/capabilities/git.ts:L222-L234'
  - symbol: commit
    kind: method
    at: 'src/capabilities/git.ts:L236-L260'
  - symbol: getHistory
    kind: method
    at: 'src/capabilities/git.ts:L262-L293'
  - symbol: getBranches
    kind: method
    at: 'src/capabilities/git.ts:L295-L328'
  - symbol: createBranch
    kind: method
    at: 'src/capabilities/git.ts:L330-L342'
  - symbol: switchBranch
    kind: method
    at: 'src/capabilities/git.ts:L344-L356'
  - symbol: getDiff
    kind: method
    at: 'src/capabilities/git.ts:L358-L379'
  - symbol: push
    kind: method
    at: 'src/capabilities/git.ts:L381-L396'
  - symbol: pull
    kind: method
    at: 'src/capabilities/git.ts:L398-L413'
  - symbol: execute
    kind: method
    at: 'src/capabilities/git.ts:L419-L438'
  - symbol: getCurrentBranch
    kind: method
    at: 'src/capabilities/git.ts:L440-L447'
  - symbol: parseFileStatus
    kind: method
    at: 'src/capabilities/git.ts:L449-L474'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/git.ts:L476-L480'
  - symbol: IssueState
    kind: type
    at: 'src/capabilities/github.ts:L21-L21'
  - symbol: PullRequestState
    kind: type
    at: 'src/capabilities/github.ts:L24-L24'
  - symbol: GitHubIssue
    kind: interface
    at: 'src/capabilities/github.ts:L27-L37'
  - symbol: GitHubPullRequest
    kind: interface
    at: 'src/capabilities/github.ts:L40-L51'
  - symbol: GitHubRepository
    kind: interface
    at: 'src/capabilities/github.ts:L54-L60'
  - symbol: GitHubComment
    kind: interface
    at: 'src/capabilities/github.ts:L63-L69'
  - symbol: GitHubWorkflow
    kind: interface
    at: 'src/capabilities/github.ts:L72-L81'
  - symbol: GitHubWorkflowRun
    kind: interface
    at: 'src/capabilities/github.ts:L84-L92'
  - symbol: IGitHubCapability
    kind: interface
    at: 'src/capabilities/github.ts:L101-L183'
  - symbol: GitHubCapability
    kind: class
    at: 'src/capabilities/github.ts:L192-L629'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/github.ts:L206-L220'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/github.ts:L222-L228'
  - symbol: getRepository
    kind: method
    at: 'src/capabilities/github.ts:L230-L248'
  - symbol: listIssues
    kind: method
    at: 'src/capabilities/github.ts:L250-L278'
  - symbol: getIssue
    kind: method
    at: 'src/capabilities/github.ts:L280-L289'
  - symbol: createIssue
    kind: method
    at: 'src/capabilities/github.ts:L291-L310'
  - symbol: updateIssue
    kind: method
    at: 'src/capabilities/github.ts:L312-L336'
  - symbol: listPullRequests
    kind: method
    at: 'src/capabilities/github.ts:L338-L357'
  - symbol: getPullRequest
    kind: method
    at: 'src/capabilities/github.ts:L359-L368'
  - symbol: createPullRequest
    kind: method
    at: 'src/capabilities/github.ts:L370-L389'
  - symbol: mergePullRequest
    kind: method
    at: 'src/capabilities/github.ts:L391-L412'
  - symbol: listIssueComments
    kind: method
    at: 'src/capabilities/github.ts:L414-L435'
  - symbol: createIssueComment
    kind: method
    at: 'src/capabilities/github.ts:L437-L453'
  - symbol: listWorkflows
    kind: method
    at: 'src/capabilities/github.ts:L459-L470'
  - symbol: getWorkflowRuns
    kind: method
    at: 'src/capabilities/github.ts:L472-L490'
  - symbol: request
    kind: method
    at: 'src/capabilities/github.ts:L496-L541'
  - symbol: parseIssue
    kind: method
    at: 'src/capabilities/github.ts:L543-L559'
  - symbol: parsePR
    kind: method
    at: 'src/capabilities/github.ts:L561-L586'
  - symbol: parseComment
    kind: method
    at: 'src/capabilities/github.ts:L588-L598'
  - symbol: parseWorkflow
    kind: method
    at: 'src/capabilities/github.ts:L600-L610'
  - symbol: parseWorkflowRun
    kind: method
    at: 'src/capabilities/github.ts:L612-L622'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/github.ts:L624-L628'
  - symbol: ResourceStatus
    kind: type
    at: 'src/capabilities/kubernetes.ts:L21-L21'
  - symbol: ResourcePhase
    kind: type
    at: 'src/capabilities/kubernetes.ts:L24-L24'
  - symbol: KubernetesPod
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L27-L36'
  - symbol: KubernetesService
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L39-L47'
  - symbol: KubernetesServicePort
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L50-L55'
  - symbol: KubernetesDeployment
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L58-L66'
  - symbol: KubernetesNamespace
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L69-L74'
  - symbol: KubernetesEvent
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L77-L83'
  - symbol: IKubernetesCapability
    kind: interface
    at: 'src/capabilities/kubernetes.ts:L92-L154'
  - symbol: KubernetesCapability
    kind: class
    at: 'src/capabilities/kubernetes.ts:L166-L594'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/kubernetes.ts:L179-L197'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/kubernetes.ts:L199-L202'
  - symbol: listPods
    kind: method
    at: 'src/capabilities/kubernetes.ts:L204-L216'
  - symbol: getPod
    kind: method
    at: 'src/capabilities/kubernetes.ts:L218-L228'
  - symbol: getPodLogs
    kind: method
    at: 'src/capabilities/kubernetes.ts:L230-L265'
  - symbol: listServices
    kind: method
    at: 'src/capabilities/kubernetes.ts:L267-L279'
  - symbol: getService
    kind: method
    at: 'src/capabilities/kubernetes.ts:L281-L291'
  - symbol: listDeployments
    kind: method
    at: 'src/capabilities/kubernetes.ts:L293-L305'
  - symbol: getDeployment
    kind: method
    at: 'src/capabilities/kubernetes.ts:L307-L317'
  - symbol: scaleDeployment
    kind: method
    at: 'src/capabilities/kubernetes.ts:L319-L338'
  - symbol: listNamespaces
    kind: method
    at: 'src/capabilities/kubernetes.ts:L340-L351'
  - symbol: getNamespace
    kind: method
    at: 'src/capabilities/kubernetes.ts:L353-L362'
  - symbol: getEvents
    kind: method
    at: 'src/capabilities/kubernetes.ts:L364-L382'
  - symbol: applyManifest
    kind: method
    at: 'src/capabilities/kubernetes.ts:L384-L401'
  - symbol: deleteResource
    kind: method
    at: 'src/capabilities/kubernetes.ts:L403-L418'
  - symbol: request
    kind: method
    at: 'src/capabilities/kubernetes.ts:L424-L457'
  - symbol: parsePod
    kind: method
    at: 'src/capabilities/kubernetes.ts:L459-L483'
  - symbol: parseService
    kind: method
    at: 'src/capabilities/kubernetes.ts:L485-L503'
  - symbol: parseDeployment
    kind: method
    at: 'src/capabilities/kubernetes.ts:L505-L518'
  - symbol: parseNamespace
    kind: method
    at: 'src/capabilities/kubernetes.ts:L520-L529'
  - symbol: parseEvent
    kind: method
    at: 'src/capabilities/kubernetes.ts:L531-L539'
  - symbol: getApiPath
    kind: method
    at: 'src/capabilities/kubernetes.ts:L541-L587'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/kubernetes.ts:L589-L593'
  - symbol: GrepMatch
    kind: interface
    at: 'src/capabilities/search.ts:L35-L40'
  - symbol: GrepOptions
    kind: interface
    at: 'src/capabilities/search.ts:L43-L48'
  - symbol: GlobOptions
    kind: interface
    at: 'src/capabilities/search.ts:L51-L56'
  - symbol: ISearchCapability
    kind: interface
    at: 'src/capabilities/search.ts:L65-L78'
  - symbol: IgnoreRule
    kind: interface
    at: 'src/capabilities/search.ts:L85-L90'
  - symbol: IgnoreRules
    kind: class
    at: 'src/capabilities/search.ts:L96-L116'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/search.ts:L97-L102'
  - symbol: matchOutcome
    kind: method
    at: 'src/capabilities/search.ts:L108-L115'
  - symbol: gitignoreGlobToSource
    kind: function
    at: 'src/capabilities/search.ts:L119-L138'
  - symbol: loadIgnoreRules
    kind: function
    at: 'src/capabilities/search.ts:L141-L169'
  - symbol: GitignoreIndex
    kind: class
    at: 'src/capabilities/search.ts:L177-L211'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/search.ts:L180-L181'
  - symbol: rulesFor
    kind: method
    at: 'src/capabilities/search.ts:L183-L191'
  - symbol: isIgnored
    kind: method
    at: 'src/capabilities/search.ts:L193-L210'
  - symbol: FilterOptions
    kind: interface
    at: 'src/capabilities/search.ts:L218-L223'
  - symbol: listAllFiles
    kind: function
    at: 'src/capabilities/search.ts:L230-L251'
  - symbol: filterFiles
    kind: function
    at: 'src/capabilities/search.ts:L258-L267'
  - symbol: filterByGlob
    kind: function
    at: 'src/capabilities/search.ts:L274-L278'
  - symbol: ExternalTools
    kind: interface
    at: 'src/capabilities/search.ts:L285-L288'
  - symbol: detectExternalTools
    kind: function
    at: 'src/capabilities/search.ts:L294-L299'
  - symbol: spawnWorks
    kind: function
    at: 'src/capabilities/search.ts:L302-L309'
  - symbol: runExternalTool
    kind: function
    at: 'src/capabilities/search.ts:L315-L327'
  - symbol: RgSubmatch
    kind: interface
    at: 'src/capabilities/search.ts:L330-L333'
  - symbol: RgMatchData
    kind: interface
    at: 'src/capabilities/search.ts:L335-L340'
  - symbol: RgEvent
    kind: interface
    at: 'src/capabilities/search.ts:L342-L345'
  - symbol: parseRgJson
    kind: function
    at: 'src/capabilities/search.ts:L348-L369'
  - symbol: compareMatches
    kind: function
    at: 'src/capabilities/search.ts:L371-L379'
  - symbol: SearchCapability
    kind: class
    at: 'src/capabilities/search.ts:L393-L574'
  - symbol: constructor
    kind: method
    at: 'src/capabilities/search.ts:L407-L408'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/search.ts:L410-L412'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/search.ts:L414-L417'
  - symbol: grep
    kind: method
    at: 'src/capabilities/search.ts:L419-L447'
  - symbol: glob
    kind: method
    at: 'src/capabilities/search.ts:L449-L487'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/search.ts:L493-L497'
  - symbol: workingDirectory
    kind: method
    at: 'src/capabilities/search.ts:L499-L501'
  - symbol: probe
    kind: method
    at: 'src/capabilities/search.ts:L504-L507'
  - symbol: rgGrep
    kind: method
    at: 'src/capabilities/search.ts:L510-L523'
  - symbol: fallbackGrep
    kind: method
    at: 'src/capabilities/search.ts:L526-L573'
  - symbol: runListFiles
    kind: function
    at: 'src/capabilities/search.ts:L577-L580'
  - symbol: ShellExecOptions
    kind: interface
    at: 'src/capabilities/shell.ts:L20-L31'
  - symbol: ShellExecResult
    kind: interface
    at: 'src/capabilities/shell.ts:L34-L45'
  - symbol: ShellEnvironment
    kind: interface
    at: 'src/capabilities/shell.ts:L48-L54'
  - symbol: IShellCapability
    kind: interface
    at: 'src/capabilities/shell.ts:L63-L81'
  - symbol: ShellCapability
    kind: class
    at: 'src/capabilities/shell.ts:L120-L335'
  - symbol: initialize
    kind: method
    at: 'src/capabilities/shell.ts:L131-L134'
  - symbol: dispose
    kind: method
    at: 'src/capabilities/shell.ts:L136-L138'
  - symbol: exec
    kind: method
    at: 'src/capabilities/shell.ts:L140-L237'
  - symbol: getEnvironment
    kind: method
    at: 'src/capabilities/shell.ts:L239-L258'
  - symbol: commandExists
    kind: method
    at: 'src/capabilities/shell.ts:L260-L278'
  - symbol: getWorkingDirectory
    kind: method
    at: 'src/capabilities/shell.ts:L280-L283'
  - symbol: setWorkingDirectory
    kind: method
    at: 'src/capabilities/shell.ts:L285-L308'
  - symbol: checkBlocked
    kind: method
    at: 'src/capabilities/shell.ts:L310-L318'
  - symbol: checkDangerous
    kind: method
    at: 'src/capabilities/shell.ts:L320-L328'
  - symbol: ensureInitialized
    kind: method
    at: 'src/capabilities/shell.ts:L330-L334'
---
<!-- context:generated:start -->
## Summary

Implementations of specific external system interactions: Git (executing real git commands), GitHub (REST API with rate limiting), Kubernetes (cluster operations), Shell (secure command execution with dangerous command blocking), File (sandboxed filesystem ops), and Search (grep/glob with external tool fallback).

## Related

- implements [[capability-framework]] — Each implements ICapability interface and registers via CapabilityRegistry
- depends on [[sandboxed-execution]] — SandboxedShellCapability uses ISandboxRuntime; FileCapability enforces sandbox root constraints
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
