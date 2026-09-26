# src/projection/desktop.ts · [[projection-system]]

- DesktopNotification · interface · L16-L21 — interface DesktopNotification
- TrayMenuItem · interface · L24-L29 — interface TrayMenuItem
- KeyboardShortcut · interface · L32-L37 — interface KeyboardShortcut
- DesktopProjectionState · type · L40-L40 — type DesktopProjectionState = "active" | "idle" | "error";
- ISystemTray · interface · L47-L60 — interface ISystemTray
- INotificationService · interface · L63-L70 — interface INotificationService
- IKeyboardShortcutService · interface · L73-L80 — interface IKeyboardShortcutService
- IDesktopProjection · interface · L89-L111 — interface IDesktopProjection
- DesktopNotificationFormatter · class · L120-L150 — class DesktopNotificationFormatter
- format · method · L121-L149 — format(event: BaseEvent): DesktopNotification
- DesktopProjection · class · L159-L241 — class DesktopProjection implements IDesktopProjection
- constructor · method · L164-L173 — constructor( tray: ISystemTray | null = null, notificationService: INotificationService | null = null, shortcutService: IKeyboardShortcutService | null = null, )
- setupTray · method · L176-L190 — setupTray(sessionActions: { open: () => void; newSession: () => void; quit: () => void; }): void
- showNotification · method · L193-L198 — showNotification(event: BaseEvent): void
- registerShortcuts · method · L201-L222 — registerShortcuts(actions: { newSession: () => void; quickInput: () => void; }): void
- setState · method · L225-L234 — setState(state: DesktopProjectionState, details?: string): void
- dispose · method · L237-L240 — dispose(): void
- createDesktopProjection · function · L250-L256 — function createDesktopProjection( tray: ISystemTray | null, notificationService: INotificationService | null, shortcutService: IKeyboardShortcutService | null, ): DesktopProjection
