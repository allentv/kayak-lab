---
name: Projection System
slug: projection-system
type: system
sources:
  - path: src/projection/__tests__/desktop.test.ts
    hash: e5b536817a8efa9347ce3acccc8fc5848f7f4b6bae804836ef9e6283e7b9a038
  - path: src/projection/__tests__/protocol.test.ts
    hash: 93d3219b3195339150f63f1233485a604f28af06eb213c3291519552c1a3e6d3
  - path: src/projection/__tests__/rest-api.test.ts
    hash: 49756be0c290bdc9c7cab8b99e719691e2f773b896d2651240698b19f5b39283
  - path: src/projection/__tests__/vscode.test.ts
    hash: 40479acb32d73fac1f2cb27a2af85ea673081566e2f667a288281875c9a50232
  - path: src/projection/__tests__/web.test.ts
    hash: 3853c1ced7f31456afca01233951652ed91129f97bd0b1ad8077db6a98dc0c9a
  - path: src/projection/__tests__/websocket-server.test.ts
    hash: d8a2123466ce4aa551d188493f7ee4f00fa99c514c48a844a180b805de80bee7
  - path: src/projection/desktop.ts
    hash: 0a8128816a6e07c437b34173da66cf7dfdf7bc7b5058424621ebf6a64f0643c2
  - path: src/projection/mod.ts
    hash: dd46e4d84375723319f84a29b2e0ec3c07c4f787c41ff6a1cb928db5fdca1e16
  - path: src/projection/protocol.ts
    hash: fbd69382aedad9ac32644194f825e4c45004e9acf2fec88ac703b6b970725f54
  - path: src/projection/rest-api.ts
    hash: 10c582275de33245dd178ccf48ca57cf3bc98a619d897ec33413d829562f5451
  - path: src/projection/terminal.ts
    hash: 680e1f7d56156ad3738940df9cf124ebbb32ebbf466400d2756f6be9025df051
  - path: src/projection/vscode.ts
    hash: 11f5b5be10fb44919e2f6a92bbf193100620f9bc4fbf9de54659a4d723be6888
  - path: src/projection/web.ts
    hash: 12b8e872b0697349feae11e4ff55156d2e57401097c6e48e37b02747989657bf
  - path: src/projection/websocket-server.ts
    hash: b0fb869ea7caf8516807774ff0c42679aea3489ddee7d75f4abbd85348a41f8a
sources_digest: 1a6e4922e6fb99c5bb8983150ad45e949829f45ae0d5049842fa57b51e5e97a2
links:
  - to: memory-system
    relation: depends_on
    description: >-
      REST API projection optionally uses AttestationService and ProvenanceGraph
      for verification and lineage tracking.
  - to: runtime-orchestration
    relation: depends_on
    description: >-
      Projection protocols subscribe to IEventStream from runtime; WebSocket
      server reads from IEventStore; REST API uses ISessionManager and
      IEventStore.
generator:
  version: 1
covers:
  - symbol: MockSystemTray
    kind: class
    at: 'src/projection/__tests__/desktop.test.ts:L16-L30'
  - symbol: setIcon
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L22-L22'
  - symbol: setTooltip
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L23-L23'
  - symbol: show
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L24-L24'
  - symbol: hide
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L25-L25'
  - symbol: setContextMenu
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L26-L28'
  - symbol: dispose
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L29-L29'
  - symbol: MockNotificationService
    kind: class
    at: 'src/projection/__tests__/desktop.test.ts:L32-L46'
  - symbol: show
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L35-L37'
  - symbol: requestPermission
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L39-L41'
  - symbol: isSupported
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L43-L45'
  - symbol: MockKeyboardShortcutService
    kind: class
    at: 'src/projection/__tests__/desktop.test.ts:L48-L62'
  - symbol: register
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L51-L53'
  - symbol: unregister
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L55-L57'
  - symbol: unregisterAll
    kind: method
    at: 'src/projection/__tests__/desktop.test.ts:L59-L61'
  - symbol: createTestEvent
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L68-L82'
  - symbol: openFn
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L99-L99'
  - symbol: newSessionFn
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L100-L100'
  - symbol: quitFn
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L101-L101'
  - symbol: newSessionFn
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L142-L142'
  - symbol: quickInputFn
    kind: function
    at: 'src/projection/__tests__/desktop.test.ts:L143-L143'
  - symbol: MockSessionManager
    kind: class
    at: 'src/projection/__tests__/rest-api.test.ts:L19-L49'
  - symbol: getSessions
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L22-L24'
  - symbol: getSession
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L26-L28'
  - symbol: createSession
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L30-L41'
  - symbol: cancelSession
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L43-L48'
  - symbol: MockEventStore
    kind: class
    at: 'src/projection/__tests__/rest-api.test.ts:L51-L96'
  - symbol: store
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L54-L58'
  - symbol: getEvents
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L60-L62'
  - symbol: getEventsInRange
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L64-L68'
  - symbol: getLastEvent
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L70-L73'
  - symbol: hasSession
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L75-L77'
  - symbol: getSessionIds
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L79-L81'
  - symbol: createSnapshot
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L83-L85'
  - symbol: getLatestSnapshot
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L87-L89'
  - symbol: getEventsAfterSnapshot
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L91-L93'
  - symbol: flush
    kind: method
    at: 'src/projection/__tests__/rest-api.test.ts:L95-L95'
  - symbol: createTestEvent
    kind: function
    at: 'src/projection/__tests__/rest-api.test.ts:L102-L117'
  - symbol: makeRequest
    kind: function
    at: 'src/projection/__tests__/rest-api.test.ts:L119-L130'
  - symbol: MockOutputChannel
    kind: class
    at: 'src/projection/__tests__/vscode.test.ts:L17-L32'
  - symbol: appendLine
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L21-L23'
  - symbol: clear
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L25-L27'
  - symbol: show
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L29-L29'
  - symbol: hide
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L30-L30'
  - symbol: dispose
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L31-L31'
  - symbol: MockStatusBarItem
    kind: class
    at: 'src/projection/__tests__/vscode.test.ts:L34-L46'
  - symbol: show
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L41-L43'
  - symbol: hide
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L44-L44'
  - symbol: dispose
    kind: method
    at: 'src/projection/__tests__/vscode.test.ts:L45-L45'
  - symbol: createTestEvent
    kind: function
    at: 'src/projection/__tests__/vscode.test.ts:L52-L66'
  - symbol: MockRestApiClient
    kind: class
    at: 'src/projection/__tests__/web.test.ts:L17-L45'
  - symbol: getSessions
    kind: method
    at: 'src/projection/__tests__/web.test.ts:L22-L24'
  - symbol: createSession
    kind: method
    at: 'src/projection/__tests__/web.test.ts:L26-L35'
  - symbol: getEvents
    kind: method
    at: 'src/projection/__tests__/web.test.ts:L37-L39'
  - symbol: sendMessage
    kind: method
    at: 'src/projection/__tests__/web.test.ts:L41-L44'
  - symbol: createTestEvent
    kind: function
    at: 'src/projection/__tests__/web.test.ts:L51-L65'
  - symbol: waitForMessage
    kind: function
    at: 'src/projection/__tests__/websocket-server.test.ts:L11-L15'
  - symbol: DesktopNotification
    kind: interface
    at: 'src/projection/desktop.ts:L16-L21'
  - symbol: TrayMenuItem
    kind: interface
    at: 'src/projection/desktop.ts:L24-L29'
  - symbol: KeyboardShortcut
    kind: interface
    at: 'src/projection/desktop.ts:L32-L37'
  - symbol: DesktopProjectionState
    kind: type
    at: 'src/projection/desktop.ts:L40-L40'
  - symbol: ISystemTray
    kind: interface
    at: 'src/projection/desktop.ts:L47-L60'
  - symbol: INotificationService
    kind: interface
    at: 'src/projection/desktop.ts:L63-L70'
  - symbol: IKeyboardShortcutService
    kind: interface
    at: 'src/projection/desktop.ts:L73-L80'
  - symbol: IDesktopProjection
    kind: interface
    at: 'src/projection/desktop.ts:L89-L111'
  - symbol: DesktopNotificationFormatter
    kind: class
    at: 'src/projection/desktop.ts:L120-L150'
  - symbol: format
    kind: method
    at: 'src/projection/desktop.ts:L121-L149'
  - symbol: DesktopProjection
    kind: class
    at: 'src/projection/desktop.ts:L159-L241'
  - symbol: constructor
    kind: method
    at: 'src/projection/desktop.ts:L164-L173'
  - symbol: setupTray
    kind: method
    at: 'src/projection/desktop.ts:L176-L190'
  - symbol: showNotification
    kind: method
    at: 'src/projection/desktop.ts:L193-L198'
  - symbol: registerShortcuts
    kind: method
    at: 'src/projection/desktop.ts:L201-L222'
  - symbol: setState
    kind: method
    at: 'src/projection/desktop.ts:L225-L234'
  - symbol: dispose
    kind: method
    at: 'src/projection/desktop.ts:L237-L240'
  - symbol: createDesktopProjection
    kind: function
    at: 'src/projection/desktop.ts:L250-L256'
  - symbol: SubscriptionId
    kind: type
    at: 'src/projection/protocol.ts:L15-L15'
  - symbol: ProjectionState
    kind: type
    at: 'src/projection/protocol.ts:L18-L18'
  - symbol: EventFilter
    kind: interface
    at: 'src/projection/protocol.ts:L21-L28'
  - symbol: SubscriptionOptions
    kind: interface
    at: 'src/projection/protocol.ts:L31-L38'
  - symbol: Subscription
    kind: interface
    at: 'src/projection/protocol.ts:L41-L52'
  - symbol: EventDeliveryCallback
    kind: type
    at: 'src/projection/protocol.ts:L55-L58'
  - symbol: DeliveryErrorCallback
    kind: type
    at: 'src/projection/protocol.ts:L61-L64'
  - symbol: IProjectionProtocol
    kind: interface
    at: 'src/projection/protocol.ts:L73-L129'
  - symbol: ProjectionProtocol
    kind: class
    at: 'src/projection/protocol.ts:L141-L423'
  - symbol: constructor
    kind: method
    at: 'src/projection/protocol.ts:L149-L151'
  - symbol: subscribe
    kind: method
    at: 'src/projection/protocol.ts:L153-L198'
  - symbol: unsubscribe
    kind: method
    at: 'src/projection/protocol.ts:L200-L226'
  - symbol: pause
    kind: method
    at: 'src/projection/protocol.ts:L228-L240'
  - symbol: resume
    kind: method
    at: 'src/projection/protocol.ts:L242-L255'
  - symbol: getSubscription
    kind: method
    at: 'src/projection/protocol.ts:L257-L268'
  - symbol: getSubscriptionsForSession
    kind: method
    at: 'src/projection/protocol.ts:L270-L281'
  - symbol: onError
    kind: method
    at: 'src/projection/protocol.ts:L283-L285'
  - symbol: deliverExistingEvents
    kind: method
    at: 'src/projection/protocol.ts:L287-L300'
  - symbol: startEventMonitoring
    kind: method
    at: 'src/projection/protocol.ts:L302-L340'
  - symbol: poll
    kind: function
    at: 'src/projection/protocol.ts:L304-L336'
  - symbol: deliverEvent
    kind: method
    at: 'src/projection/protocol.ts:L342-L372'
  - symbol: matchesFilter
    kind: method
    at: 'src/projection/protocol.ts:L374-L402'
  - symbol: handleError
    kind: method
    at: 'src/projection/protocol.ts:L404-L418'
  - symbol: generateSubscriptionId
    kind: method
    at: 'src/projection/protocol.ts:L420-L422'
  - symbol: SubscriptionState
    kind: interface
    at: 'src/projection/protocol.ts:L430-L439'
  - symbol: ApiError
    kind: interface
    at: 'src/projection/rest-api.ts:L19-L23'
  - symbol: SessionResponse
    kind: interface
    at: 'src/projection/rest-api.ts:L26-L34'
  - symbol: EventListResponse
    kind: interface
    at: 'src/projection/rest-api.ts:L37-L42'
  - symbol: MessageRequest
    kind: interface
    at: 'src/projection/rest-api.ts:L45-L48'
  - symbol: MessageResponse
    kind: interface
    at: 'src/projection/rest-api.ts:L51-L56'
  - symbol: RouteHandler
    kind: type
    at: 'src/projection/rest-api.ts:L59-L62'
  - symbol: ApiRoute
    kind: interface
    at: 'src/projection/rest-api.ts:L65-L70'
  - symbol: RestApiConfig
    kind: interface
    at: 'src/projection/rest-api.ts:L73-L77'
  - symbol: ApiKeyAuth
    kind: class
    at: 'src/projection/rest-api.ts:L86-L116'
  - symbol: constructor
    kind: method
    at: 'src/projection/rest-api.ts:L90-L93'
  - symbol: authorize
    kind: method
    at: 'src/projection/rest-api.ts:L96-L107'
  - symbol: unauthorizedResponse
    kind: method
    at: 'src/projection/rest-api.ts:L110-L115'
  - symbol: RestApiRouter
    kind: class
    at: 'src/projection/rest-api.ts:L125-L206'
  - symbol: constructor
    kind: method
    at: 'src/projection/rest-api.ts:L130-L135'
  - symbol: route
    kind: method
    at: 'src/projection/rest-api.ts:L138-L140'
  - symbol: handle
    kind: method
    at: 'src/projection/rest-api.ts:L143-L177'
  - symbol: matchPath
    kind: method
    at: 'src/projection/rest-api.ts:L180-L190'
  - symbol: extractParams
    kind: method
    at: 'src/projection/rest-api.ts:L193-L205'
  - symbol: RestApiProjection
    kind: class
    at: 'src/projection/rest-api.ts:L215-L510'
  - symbol: constructor
    kind: method
    at: 'src/projection/rest-api.ts:L222-L234'
  - symbol: setProvenanceGraph
    kind: method
    at: 'src/projection/rest-api.ts:L237-L239'
  - symbol: handleRequest
    kind: method
    at: 'src/projection/rest-api.ts:L242-L244'
  - symbol: registerRoutes
    kind: method
    at: 'src/projection/rest-api.ts:L246-L268'
  - symbol: listSessions
    kind: method
    at: 'src/projection/rest-api.ts:L271-L283'
  - symbol: createSession
    kind: method
    at: 'src/projection/rest-api.ts:L286-L306'
  - symbol: getSession
    kind: method
    at: 'src/projection/rest-api.ts:L309-L324'
  - symbol: deleteSession
    kind: method
    at: 'src/projection/rest-api.ts:L327-L339'
  - symbol: listEvents
    kind: method
    at: 'src/projection/rest-api.ts:L342-L361'
  - symbol: getEvent
    kind: method
    at: 'src/projection/rest-api.ts:L364-L377'
  - symbol: sendMessage
    kind: method
    at: 'src/projection/rest-api.ts:L380-L424'
  - symbol: getAttestation
    kind: method
    at: 'src/projection/rest-api.ts:L427-L443'
  - symbol: listAttestations
    kind: method
    at: 'src/projection/rest-api.ts:L446-L465'
  - symbol: getProvenance
    kind: method
    at: 'src/projection/rest-api.ts:L468-L475'
  - symbol: getProvenanceNodes
    kind: method
    at: 'src/projection/rest-api.ts:L478-L493'
  - symbol: getProvenanceChain
    kind: method
    at: 'src/projection/rest-api.ts:L496-L509'
  - symbol: TerminalStyle
    kind: interface
    at: 'src/projection/terminal.ts:L20-L33'
  - symbol: IEventRenderer
    kind: interface
    at: 'src/projection/terminal.ts:L36-L39'
  - symbol: InputHandler
    kind: type
    at: 'src/projection/terminal.ts:L42-L42'
  - symbol: TerminalProjectionOptions
    kind: interface
    at: 'src/projection/terminal.ts:L45-L54'
  - symbol: DefaultEventRenderer
    kind: class
    at: 'src/projection/terminal.ts:L63-L167'
  - symbol: constructor
    kind: method
    at: 'src/projection/terminal.ts:L66-L68'
  - symbol: render
    kind: method
    at: 'src/projection/terminal.ts:L70-L84'
  - symbol: getStyleForEventType
    kind: method
    at: 'src/projection/terminal.ts:L86-L103'
  - symbol: getPrefixForEventType
    kind: method
    at: 'src/projection/terminal.ts:L105-L108'
  - symbol: formatTimestamp
    kind: method
    at: 'src/projection/terminal.ts:L110-L117'
  - symbol: formatPayload
    kind: method
    at: 'src/projection/terminal.ts:L119-L132'
  - symbol: colorize
    kind: method
    at: 'src/projection/terminal.ts:L134-L152'
  - symbol: getColorCode
    kind: method
    at: 'src/projection/terminal.ts:L154-L166'
  - symbol: TerminalProjection
    kind: class
    at: 'src/projection/terminal.ts:L179-L296'
  - symbol: constructor
    kind: method
    at: 'src/projection/terminal.ts:L186-L197'
  - symbol: start
    kind: method
    at: 'src/projection/terminal.ts:L205-L223'
  - symbol: callback
    kind: function
    at: 'src/projection/terminal.ts:L210-L212'
  - symbol: stop
    kind: method
    at: 'src/projection/terminal.ts:L228-L235'
  - symbol: onInput
    kind: method
    at: 'src/projection/terminal.ts:L242-L244'
  - symbol: removeInputHandler
    kind: method
    at: 'src/projection/terminal.ts:L251-L253'
  - symbol: getSubscription
    kind: method
    at: 'src/projection/terminal.ts:L258-L260'
  - symbol: write
    kind: method
    at: 'src/projection/terminal.ts:L267-L276'
  - symbol: renderEvent
    kind: method
    at: 'src/projection/terminal.ts:L278-L281'
  - symbol: setupInputHandling
    kind: method
    at: 'src/projection/terminal.ts:L283-L291'
  - symbol: teardownInputHandling
    kind: method
    at: 'src/projection/terminal.ts:L293-L295'
  - symbol: StreamingDisplay
    kind: class
    at: 'src/projection/terminal.ts:L307-L357'
  - symbol: constructor
    kind: method
    at: 'src/projection/terminal.ts:L312-L315'
  - symbol: addLine
    kind: method
    at: 'src/projection/terminal.ts:L322-L331'
  - symbol: clear
    kind: method
    at: 'src/projection/terminal.ts:L336-L339'
  - symbol: getBuffer
    kind: method
    at: 'src/projection/terminal.ts:L344-L346'
  - symbol: redraw
    kind: method
    at: 'src/projection/terminal.ts:L348-L356'
  - symbol: AgentState
    kind: type
    at: 'src/projection/vscode.ts:L17-L17'
  - symbol: SessionTreeItem
    kind: interface
    at: 'src/projection/vscode.ts:L44-L51'
  - symbol: TreeItem
    kind: interface
    at: 'src/projection/vscode.ts:L54-L60'
  - symbol: IOutputChannel
    kind: interface
    at: 'src/projection/vscode.ts:L63-L69'
  - symbol: IStatusBarItem
    kind: interface
    at: 'src/projection/vscode.ts:L72-L80'
  - symbol: IVSCodeProjection
    kind: interface
    at: 'src/projection/vscode.ts:L89-L107'
  - symbol: SessionTreeDataProvider
    kind: class
    at: 'src/projection/vscode.ts:L116-L161'
  - symbol: onDidChangeTreeData
    kind: method
    at: 'src/projection/vscode.ts:L121-L128'
  - symbol: getTreeItem
    kind: method
    at: 'src/projection/vscode.ts:L131-L139'
  - symbol: getChildren
    kind: method
    at: 'src/projection/vscode.ts:L142-L147'
  - symbol: refresh
    kind: method
    at: 'src/projection/vscode.ts:L150-L160'
  - symbol: EventFormatter
    kind: class
    at: 'src/projection/vscode.ts:L170-L184'
  - symbol: format
    kind: method
    at: 'src/projection/vscode.ts:L172-L178'
  - symbol: getColor
    kind: method
    at: 'src/projection/vscode.ts:L181-L183'
  - symbol: VSCodeProjection
    kind: class
    at: 'src/projection/vscode.ts:L193-L272'
  - symbol: constructor
    kind: method
    at: 'src/projection/vscode.ts:L200-L209'
  - symbol: renderEvent
    kind: method
    at: 'src/projection/vscode.ts:L212-L221'
  - symbol: updateSessionList
    kind: method
    at: 'src/projection/vscode.ts:L224-L228'
  - symbol: updateStatusBar
    kind: method
    at: 'src/projection/vscode.ts:L231-L250'
  - symbol: setFilters
    kind: method
    at: 'src/projection/vscode.ts:L253-L255'
  - symbol: clearOutput
    kind: method
    at: 'src/projection/vscode.ts:L258-L260'
  - symbol: showOutput
    kind: method
    at: 'src/projection/vscode.ts:L263-L265'
  - symbol: dispose
    kind: method
    at: 'src/projection/vscode.ts:L268-L271'
  - symbol: ClientMessage
    kind: type
    at: 'src/projection/vscode.ts:L279-L284'
  - symbol: ServerMessage
    kind: type
    at: 'src/projection/vscode.ts:L287-L293'
  - symbol: VSCodeWebSocketClientConfig
    kind: interface
    at: 'src/projection/vscode.ts:L296-L300'
  - symbol: VSCodeWebSocketClient
    kind: class
    at: 'src/projection/vscode.ts:L306-L416'
  - symbol: constructor
    kind: method
    at: 'src/projection/vscode.ts:L314-L320'
  - symbol: connect
    kind: method
    at: 'src/projection/vscode.ts:L323-L355'
  - symbol: subscribe
    kind: method
    at: 'src/projection/vscode.ts:L358-L360'
  - symbol: unsubscribe
    kind: method
    at: 'src/projection/vscode.ts:L363-L365'
  - symbol: onEvent
    kind: method
    at: 'src/projection/vscode.ts:L368-L373'
  - symbol: onStateChange
    kind: method
    at: 'src/projection/vscode.ts:L376-L381'
  - symbol: disconnect
    kind: method
    at: 'src/projection/vscode.ts:L384-L394'
  - symbol: send
    kind: method
    at: 'src/projection/vscode.ts:L396-L400'
  - symbol: scheduleReconnect
    kind: method
    at: 'src/projection/vscode.ts:L402-L411'
  - symbol: notifyState
    kind: method
    at: 'src/projection/vscode.ts:L413-L415'
  - symbol: VSCodeProjectionBundle
    kind: interface
    at: 'src/projection/vscode.ts:L423-L426'
  - symbol: createVSCodeProjection
    kind: function
    at: 'src/projection/vscode.ts:L431-L457'
  - symbol: WebSocketState
    kind: type
    at: 'src/projection/web.ts:L17-L17'
  - symbol: SessionListItem
    kind: interface
    at: 'src/projection/web.ts:L20-L26'
  - symbol: EventLogItem
    kind: interface
    at: 'src/projection/web.ts:L29-L35'
  - symbol: UserInputResult
    kind: interface
    at: 'src/projection/web.ts:L38-L42'
  - symbol: EventDetail
    kind: interface
    at: 'src/projection/web.ts:L45-L51'
  - symbol: IWebProjection
    kind: interface
    at: 'src/projection/web.ts:L60-L90'
  - symbol: WebRestApiConfig
    kind: interface
    at: 'src/projection/web.ts:L97-L101'
  - symbol: WebRestApiClient
    kind: class
    at: 'src/projection/web.ts:L106-L177'
  - symbol: constructor
    kind: method
    at: 'src/projection/web.ts:L109-L111'
  - symbol: getSessions
    kind: method
    at: 'src/projection/web.ts:L114-L121'
  - symbol: createSession
    kind: method
    at: 'src/projection/web.ts:L124-L136'
  - symbol: getEvents
    kind: method
    at: 'src/projection/web.ts:L139-L150'
  - symbol: sendMessage
    kind: method
    at: 'src/projection/web.ts:L153-L168'
  - symbol: getHeaders
    kind: method
    at: 'src/projection/web.ts:L170-L176'
  - symbol: WebWebSocketConfig
    kind: interface
    at: 'src/projection/web.ts:L184-L188'
  - symbol: WebWebSocketClient
    kind: class
    at: 'src/projection/web.ts:L194-L308'
  - symbol: constructor
    kind: method
    at: 'src/projection/web.ts:L203-L209'
  - symbol: connect
    kind: method
    at: 'src/projection/web.ts:L212-L245'
  - symbol: subscribe
    kind: method
    at: 'src/projection/web.ts:L248-L251'
  - symbol: unsubscribe
    kind: method
    at: 'src/projection/web.ts:L254-L257'
  - symbol: onEvent
    kind: method
    at: 'src/projection/web.ts:L260-L265'
  - symbol: onStateChange
    kind: method
    at: 'src/projection/web.ts:L268-L273'
  - symbol: disconnect
    kind: method
    at: 'src/projection/web.ts:L276-L286'
  - symbol: send
    kind: method
    at: 'src/projection/web.ts:L288-L292'
  - symbol: scheduleReconnect
    kind: method
    at: 'src/projection/web.ts:L294-L303'
  - symbol: notifyState
    kind: method
    at: 'src/projection/web.ts:L305-L307'
  - symbol: WebEventFormatter
    kind: class
    at: 'src/projection/web.ts:L317-L333'
  - symbol: format
    kind: method
    at: 'src/projection/web.ts:L318-L322'
  - symbol: formatDetail
    kind: method
    at: 'src/projection/web.ts:L324-L332'
  - symbol: WebProjection
    kind: class
    at: 'src/projection/web.ts:L342-L459'
  - symbol: constructor
    kind: method
    at: 'src/projection/web.ts:L354-L358'
  - symbol: loadSessions
    kind: method
    at: 'src/projection/web.ts:L361-L366'
  - symbol: createSession
    kind: method
    at: 'src/projection/web.ts:L369-L373'
  - symbol: selectSession
    kind: method
    at: 'src/projection/web.ts:L376-L380'
  - symbol: getEvents
    kind: method
    at: 'src/projection/web.ts:L383-L391'
  - symbol: sendMessage
    kind: method
    at: 'src/projection/web.ts:L394-L399'
  - symbol: getEventDetail
    kind: method
    at: 'src/projection/web.ts:L402-L405'
  - symbol: onSessionListChange
    kind: method
    at: 'src/projection/web.ts:L408-L413'
  - symbol: onEvent
    kind: method
    at: 'src/projection/web.ts:L416-L421'
  - symbol: onConnectionStateChange
    kind: method
    at: 'src/projection/web.ts:L424-L429'
  - symbol: dispose
    kind: method
    at: 'src/projection/web.ts:L432-L437'
  - symbol: start
    kind: method
    at: 'src/projection/web.ts:L440-L454'
  - symbol: notifySessionList
    kind: method
    at: 'src/projection/web.ts:L456-L458'
  - symbol: WebProjectionBundle
    kind: interface
    at: 'src/projection/web.ts:L466-L470'
  - symbol: createWebProjection
    kind: function
    at: 'src/projection/web.ts:L475-L483'
  - symbol: Subscription
    kind: interface
    at: 'src/projection/websocket-server.ts:L17-L21'
  - symbol: ClientSessionState
    kind: interface
    at: 'src/projection/websocket-server.ts:L24-L29'
  - symbol: ClientState
    kind: interface
    at: 'src/projection/websocket-server.ts:L32-L44'
  - symbol: WelcomeMessage
    kind: interface
    at: 'src/projection/websocket-server.ts:L47-L51'
  - symbol: SubscribeMessage
    kind: interface
    at: 'src/projection/websocket-server.ts:L54-L58'
  - symbol: UnsubscribeMessage
    kind: interface
    at: 'src/projection/websocket-server.ts:L61-L63'
  - symbol: ReconnectMessage
    kind: interface
    at: 'src/projection/websocket-server.ts:L66-L70'
  - symbol: ServerMessage
    kind: type
    at: 'src/projection/websocket-server.ts:L73-L79'
  - symbol: ClientMessage
    kind: type
    at: 'src/projection/websocket-server.ts:L82-L87'
  - symbol: BackpressureConfig
    kind: interface
    at: 'src/projection/websocket-server.ts:L90-L95'
  - symbol: WebSocketServerConfig
    kind: interface
    at: 'src/projection/websocket-server.ts:L98-L105'
  - symbol: RingBuffer
    kind: class
    at: 'src/projection/websocket-server.ts:L114-L146'
  - symbol: constructor
    kind: method
    at: 'src/projection/websocket-server.ts:L118-L120'
  - symbol: push
    kind: method
    at: 'src/projection/websocket-server.ts:L122-L127'
  - symbol: getAfter
    kind: method
    at: 'src/projection/websocket-server.ts:L132-L134'
  - symbol: findIndex
    kind: method
    at: 'src/projection/websocket-server.ts:L139-L141'
  - symbol: size
    kind: method
    at: 'src/projection/websocket-server.ts:L143-L145'
  - symbol: WebSocketProjectionServer
    kind: class
    at: 'src/projection/websocket-server.ts:L155-L556'
  - symbol: constructor
    kind: method
    at: 'src/projection/websocket-server.ts:L164-L173'
  - symbol: start
    kind: method
    at: 'src/projection/websocket-server.ts:L178-L191'
  - symbol: shutdown
    kind: method
    at: 'src/projection/websocket-server.ts:L196-L212'
  - symbol: handleRequest
    kind: method
    at: 'src/projection/websocket-server.ts:L217-L223'
  - symbol: handleWebSocketUpgrade
    kind: method
    at: 'src/projection/websocket-server.ts:L228-L267'
  - symbol: sendWelcome
    kind: method
    at: 'src/projection/websocket-server.ts:L272-L279'
  - symbol: handleMessage
    kind: method
    at: 'src/projection/websocket-server.ts:L284-L310'
  - symbol: handleSubscribe
    kind: method
    at: 'src/projection/websocket-server.ts:L315-L347'
  - symbol: handleUnsubscribe
    kind: method
    at: 'src/projection/websocket-server.ts:L352-L354'
  - symbol: handleReconnect
    kind: method
    at: 'src/projection/websocket-server.ts:L359-L392'
  - symbol: deliverEvent
    kind: method
    at: 'src/projection/websocket-server.ts:L399-L446'
  - symbol: flushClientSession
    kind: method
    at: 'src/projection/websocket-server.ts:L452-L466'
  - symbol: enqueueEvent
    kind: method
    at: 'src/projection/websocket-server.ts:L472-L474'
  - symbol: flushClient
    kind: method
    at: 'src/projection/websocket-server.ts:L480-L498'
  - symbol: sendHeartbeats
    kind: method
    at: 'src/projection/websocket-server.ts:L506-L528'
  - symbol: sendToClient
    kind: method
    at: 'src/projection/websocket-server.ts:L533-L537'
  - symbol: sendError
    kind: method
    at: 'src/projection/websocket-server.ts:L542-L548'
  - symbol: clientCount
    kind: method
    at: 'src/projection/websocket-server.ts:L553-L555'
---
<!-- context:generated:start -->
## Summary

Multi-platform UI surface layer that subscribes to event streams and renders agent state. Includes protocol for subscription management, WebSocket server for real-time delivery, and implementations for terminal, VS Code, web, desktop (Tauri), and REST API. Handles backpressure, gap recovery, and authentication.

## Related

- depends on [[memory-system]] — REST API projection optionally uses AttestationService and ProvenanceGraph for verification and lineage tracking.
- depends on [[runtime-orchestration]] — Projection protocols subscribe to IEventStream from runtime; WebSocket server reads from IEventStore; REST API uses ISessionManager and IEventStore.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
