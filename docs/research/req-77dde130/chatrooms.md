# Research: Chatrooms and Live-Trading Workflow Patterns (req-77dde130)

Date: 2026-03-08  
Domain: research-chatrooms  
File: `docs/research/req-77dde130/chatrooms.md`

## Scope

Researched public live-trading/chatroom artifacts (support docs, public recaps, and community live threads) to extract time-critical workflows in:
- alerts
- watchlist triage
- execution coordination

Output below translates observed behavior into implementable KalshiAlpha UX primitives.

## Source Set (Public)

1. Warrior Trading: Live trading sessions/watchlist context  
   https://support.warriortrading.com/support/solutions/articles/19000114764-live-trading-sessions-what-did-ross-and-the-warrior-trading-team-trade-today-what-is-on-your-watch-
2. Warrior Trading: Chat room schedule and room structure  
   https://support.warriortrading.com/support/solutions/articles/19000094161-live-trading-chat-rooms-schedule-audio-hours
3. Warrior Trading: How alerts work and latency caveats  
   https://support.warriortrading.com/support/solutions/articles/19000045057-how-do-live-trading-and-chat-room-trade-alerts-work-can-i-follow-you-and-make-money-
4. Warrior Trading: Public recap format example  
   https://www.warriortrading.com/chat-room-preview-recap/
5. TradingView: Webhook alert delivery constraints  
   https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/
6. TradingView: Watchlist alerts behavior and plan limits  
   https://www.tradingview.com/support/solutions/43000745852-watchlist-alerts/
7. Discord API: Webhook message/thread routing requirements  
   https://discord.com/developers/docs/resources/webhook
8. Discord Help: Threads behavior (search, archive, persistence)  
   https://support.discord.com/hc/en-us/articles/4403205878423-Threads-FAQ
9. Discord Help: Forum channels and tags for topic triage  
   https://support.discord.com/hc/en-us/articles/6208479917079-Forum-Channels-FAQ
10. Discord Help: Channel Following (announcement fanout)  
    https://support.discord.com/hc/en-us/articles/360028384531-Channel-Following-FAQ
11. StocksToTrade: Room-hour segmentation (market-hours vs pro chat)  
    https://support.stockstotrade.com/hc/en-us/articles/4403124504215-What-are-the-chatrooms-Hours
12. Reddit r/RealDayTrading: Live day-trading thread rules/transcript style  
    https://www.reddit.com/r/RealDayTrading/comments/pcmv2w/live_day_trading/
13. Reddit r/RealDayTrading: Daily live-trading thread format continuity  
    https://www.reddit.com/r/RealDayTrading/comments/1h3qk6i/live_day_trading_04_dec_2024/

## Observed Time-Critical Workflow Patterns

## 1) Watchlist Triage Is Timeboxed and Multi-Lane

Observed:
- Live educators explicitly build watchlists on the morning of each session and emphasize pre-market live watchlist discussion.
- Room architecture is split by strategy/asset lens (small cap, large cap/options, news, support/lounge).
- Watchlist alerting tools trigger per-symbol conditions and have capability limits by user plan.

KalshiAlpha primitives:
- `Premarket Triage Board` (06:30-09:00 local): ranked candidates with catalyst, liquidity, event window, and confidence.
- `Lane Tags`: `macro`, `event`, `flow`, `mean-revert`, `breakout`, `hedge`, `news`.
- `Watchlist State Machine`: `candidate -> armed -> active -> invalidated -> archived`.
- `Room-to-watchlist binding`: each room/lane shows only linked symbols/contracts unless user opts into global feed.

## 2) Alert Delivery Uses a High-Signal Core Feed + Filter Controls

Observed:
- Chat products expose consolidated scanner/alert feeds and include filtering controls (follow specific moderators, hide users, ticker-only views).
- External alert transports have strict reliability constraints (webhook auth prerequisites, short timeout windows, limited ports).
- Webhook posting into threaded chat requires explicit thread routing metadata.

KalshiAlpha primitives:
- `Alert Envelope` (required fields):
  - `id`, `ts`, `contract`, `side`, `thesis`, `trigger`, `invalidates_at`, `risk_note`, `source`, `priority`
- `Fanout Router`:
  - route by `lane`, `ticker`, `moderator`, and `priority`
  - post to both room timeline and per-contract thread
- `Noise Controls`:
  - follow/mute by analyst
  - collapse low-priority alerts during open
  - ticker-only mode
- `Delivery SLO`:
  - p95 ingest-to-render under 1.5s for in-app alerts
  - webhook retry queue and explicit stale badges after timeout

## 3) Execution Coordination Depends on Structured Callouts, Not Free-Form Chat

Observed:
- Live rooms warn against mirror-trading and stress educational framing over copy-trading; text/SMS are not reliable for real-time fills.
- Public live-thread rules require precise structure (ticker casing, instrument type, strike/expiry for options, declared long/short intent).
- Recap examples show sequence-based updates (entry, add, trim, exit, rationale, P/L context).

KalshiAlpha primitives:
- `Execution Callout Composer` (enforced schema):
  - contract, direction, setup type, entry zone, stop/invalidation, targets, size bucket, confidence
- `Lifecycle Updates` as one-click actions:
  - `armed`, `entered`, `scaled`, `trimmed`, `closed`, `canceled`
- `Staleness Guard`:
  - alert cards auto-mark `stale` after configurable TTL
  - action buttons disable on stale unless user force-enables
- `Educational Boundary Banner`:
  - recurring in-room disclosure that callouts are educational; no implied copy execution guarantee

## 4) Recap and Search Loops Are Part of the Core Product, Not an Afterthought

Observed:
- Live-trading businesses publish daily recap artifacts and maintain session archives.
- Community tools support threads/search; forums persist topic timelines longer than ephemeral chat.
- Active rooms designate moderators and run rule-based posting to keep live flows readable.

KalshiAlpha primitives:
- `Auto-Recap Builder`:
  - converts lifecycle events into session timeline and P/L attribution by lane
- `Session Journal`:
  - searchable by contract, analyst, thesis tag, and outcome
- `Thread Policy`:
  - active contract threads auto-archive after inactivity; pin critical threads to prevent archive
- `Moderator Controls`:
  - schema validation toggle (strict/relaxed)
  - rate-limit spammy users during market open

## 5) Broadcast Topology Matters (One Source, Many Sinks)

Observed:
- Announcement/follow mechanics in chat platforms broadcast one source channel into multiple destination servers/channels.
- Some products separate market-hours coaching from extended-hour pro chat, implying different urgency profiles.

KalshiAlpha primitives:
- `Announcement Bus`:
  - one authoritative room (`desk-alerts`) syndicates to lane rooms
- `Urgency Bands`:
  - `critical` (interruptive), `high` (banner), `normal` (timeline), `low` (collapsed)
- `Hours Profile`:
  - `premarket`, `cash-session`, `after-hours` notification and routing presets

## Implementable UX Primitive Backlog (KalshiAlpha)

| Priority | Primitive | Build Shape | Why It Maps to Research |
|---|---|---|---|
| P0 | Structured alert object + composer | Form with hard-required execution fields and validation | Real rooms enforce compact, structured callouts under time pressure |
| P0 | Room timeline with lifecycle chips | Event cards with one-click status transitions | Recap/transcript patterns are sequence-driven, not single-message driven |
| P0 | Follow/mute/ticker-only filters | Per-user feed controls and saved presets | High-volume rooms require local denoising during open |
| P0 | Premarket triage board | Ranked watchlist with lane tags and state transitions | Watchlist building happens in a fixed pre-open window |
| P1 | Thread-per-contract routing | Auto-create thread on first alert, route updates by contract id | Keeps execution coordination localized while preserving main timeline clarity |
| P1 | Announcement syndication | Publish once, fan out by room policy | Mirrors cross-channel follow patterns in Discord-like ecosystems |
| P1 | Staleness and latency instrumentation | TTL badges, render-delay telemetry, retry metrics | Source systems warn that delayed alerts are dangerous for execution |
| P2 | Auto-recap and searchable journal | End-of-session generated report + filters | Public communities rely on recaps and archives for learning loops |
| P2 | Moderator enforcement toolkit | Rule templates, slow mode, schema strictness | Live thread quality depends on explicit rule enforcement |

## Suggested MVP Sequence

1. Build `structured alert composer` + `lifecycle timeline` + `feed filters` as one thin vertical slice.  
2. Add `premarket triage board` with state transitions and lane tagging.  
3. Add `thread-per-contract` and `announcement bus` routing.  
4. Add telemetry (`staleness`, `delivery latency`, `fanout failures`) and auto-recap generation.

## Notes / Constraints

- Public evidence consistently warns against copy-trading assumptions; UX should emphasize context and invalidation, not blind mirroring.
- External webhook dependencies imply timeout/failure handling must be explicit in product behavior.
- For production, run a deeper pass on private Discord trading communities where message history is available under access permissions; this pass focused on public artifacts only.
