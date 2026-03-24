# Component Inventory

## Shell & Window Management
| File | Description |
|------|-------------|
| Shell.jsx | Main workspace container, window reducer, keyboard nav |
| WindowManager.jsx | Renders Window instances, drag-drop merging |
| Window.jsx | Draggable/resizable window frame, title bar, tabs |
| PopoutWindow.jsx | OS-level pop-out window support |
| SnapManager.jsx | Smart window positioning (avoid overlaps) |
| TitleBar.jsx | App title bar (Electron integration) |
| MenuBar.jsx | Menu system with categories, badges for shortcuts |
| SettingsPanel.jsx | Global settings dialog |
| GridSettingsPanel.jsx | Grid/layout customization |

## Trade Components
| File | Description |
|------|-------------|
| Montage.jsx + MontageSettings.jsx | Order entry with ticker search, side/action/type |
| PriceLadder.jsx + PriceLadderSettings.jsx | DOM-style price ladder, click-to-trade |
| OrderBook.jsx + OrderBookSettings.jsx | Full depth orderbook display |
| Positions.jsx + PositionsSettings.jsx | Open positions with P&L |
| Accounts.jsx + AccountsSettings.jsx | Account balance/info |
| TradeLog.jsx + TradeLogSettings.jsx | Fill history |
| EventLog.jsx + EventLogSettings.jsx | System event log |
| ChangesTab.jsx | Price change tracker |
| NewsChat.jsx | News feed / chat component |

## Quote Components
| File | Description |
|------|-------------|
| Chart.jsx + ChartSettings.jsx | TradingView Lightweight Charts integration |
| TimeSale.jsx | Time & Sales tape (trade feed) |
| MarketViewer.jsx | Market watchlist / browser |

## Scanner Components
| File | Description |
|------|-------------|
| LiveScanner.jsx | Real-time scanner alerts |
| HistoricalScanner.jsx | Historical pattern analysis |
| AlertTrigger.jsx | Alert rule CRUD + history |
| MarketClock.jsx + MarketClockSettings.jsx | Market session clock |

## Setup Components
| File | Description |
|------|-------------|
| HotkeyManager.jsx | Hotkey binding configuration UI |

## Services Layer
| File | Description |
|------|-------------|
| dataFeed.js | Unified data adapter (mock ↔ live) |
| kalshiApi.js | REST API client with RSA-PSS auth |
| kalshiWebSocket.js | WebSocket client with auto-reconnect |
| mockData.js | Mock data generators for development |
| settingsStore.js | localStorage-backed settings with pub/sub |
| hotkeyStore.js | Hotkey bindings with profiles |
| hotkeyLanguage.js | Hotkey DSL parser |
| linkBus.js | Color link event bus |
| omsEngine.js | Order FSM + position aggregation |
| omsService.js | OMS-to-API bridge |
| alertService.js | Alert rule engine orchestration |
| alertEngine.worker.js | Web Worker for alert evaluation |
| analyticsCalc.js | Analytics calculations |
| analyticsService.js | Analytics data service |
| changeTrackingService.js | Price change tracking |
| displayFormat.js | Number/price formatting |
| auditStateService.js | State auditing |
| interactionAuditService.js | Interaction tracking |
| researchLoop.js | Research loop integration |

## Hooks
| File | Description |
|------|-------------|
| useKalshiConnection.js | Connection lifecycle management |
| useKalshiData.js | Data subscription hook |
| useHotkeyDispatch.js | Hotkey event handling |
| useCombobox.js | Combobox (ticker search) hook |
| useDialogFocusTrap.js | Accessibility: dialog focus trap |
| useGridCustomization.js | Grid layout customization |

## Utils
| File | Description |
|------|-------------|
| dialogA11y.js | Dialog accessibility utilities |
