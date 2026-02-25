# KalshiAlpha — Project Architecture & Direction

> Decisions made Feb 2026. Update this file as direction evolves.

---

## What We Are Building

A **web-based trading terminal + scanner** for Kalshi prediction markets. Target audience: active traders who want professional-grade tooling (scanners, DOM/price ladder, Time & Sales, charting) that doesn't exist for Kalshi today.

End-game: a product comparable to TradingView — web version as primary, optional desktop wrapper (Tauri) later. Not a bot, not algo trading — a human-facing terminal.

---

## Tech Stack Decisions

### Frontend
| Decision | Choice | Why |
|----------|--------|-----|
| Framework | **Vite + React** (now) → **Next.js** (when ready for prod) | Vite for fast local dev; Next.js adds SSR, routing, API routes when needed |
| Desktop wrapper | **Tauri** (later, if needed) | Rust-based, ~10MB installer vs Electron's ~150MB, uses system WebView |
| **NOT Electron** | Ruled out | 150MB Chromium bundle, high maintenance, separate codebase concerns |
| Charting | **TradingView Lightweight Charts** | MIT licensed, battle-tested, performant, designed for financial data |
| UI components | **Lucide React** + custom | Already in project |

### Backend
| Layer | Service | What It Does |
|-------|---------|--------------|
| Database | **Supabase** (PostgreSQL) | Stores users, saved scans, trade history, API keys |
| Auth | **Supabase Auth** or **Clerk** | User login, sessions, JWT tokens |
| Frontend hosting | **Vercel** | Hosts the Next.js app, global CDN |
| API server | **Railway** (Node.js) | Connects to Kalshi API, handles auth, serves data to frontend |
| Scanner engine | **Railway** (Node.js service) | Centralized scan processing — users don't run scans locally |
| Real-time fan-out | **Redis pub/sub** | Market data from Kalshi WS → broadcast to all connected users |
| Real-time to browser | **Supabase Realtime** or **WebSockets** | Push scanner hits + market updates to UI |

### Why Centralized Scanner (Not Client-Side)
Each user hitting the Kalshi API independently would: (a) exceed rate limits fast, (b) add latency overhead on user machines, (c) prevent sharing scan results across users. A single backend scanner engine connects once, processes everything, and fans out results via Redis → all users get the same low-latency feed.

---

## Infrastructure Map

```
Browser (Next.js on Vercel)
    │
    ├── REST/GraphQL → Railway API Server (Node.js)
    │                       │
    │                       ├── Kalshi REST API (market data, orders)
    │                       ├── Supabase (user data, saved config)
    │                       └── Redis (pub/sub for market data)
    │
    └── WebSocket → Railway Scanner Engine (Node.js)
                        │
                        ├── Kalshi WebSocket (orderbook_delta stream)
                        ├── Redis (publish scanner hits)
                        └── Supabase (persist scan results)
```

---

## Service Cost Reference

| Service | Free Tier | Paid Tier | What You're Paying For |
|---------|-----------|-----------|------------------------|
| **Supabase** | 500MB DB, 50k users | $25/mo (Pro) | Database, auth, real-time |
| **Vercel** | 100GB bandwidth | $20/mo (Pro) | Frontend hosting, CDN |
| **Railway** | $5 credit/mo | ~$10-20/mo | API server + scanner engine compute |
| **Redis** (Upstash) | 10k commands/day | ~$0.20/100k cmds | Pub/sub for market data |

Early stage: ~$0/mo on free tiers. Production-grade: ~$60-80/mo total.

---

## Supabase vs Vercel — The Distinction

These are **different products at different layers**, not alternatives:

- **Supabase** = your backend database. Stores data, handles logins, has real-time subscriptions. Think of it as your warehouse.
- **Vercel** = your frontend host. Serves your website to users via global CDN. Think of it as the storefront.

You need both. Your Next.js app (on Vercel) calls Supabase to read/write data.

---

## Security Architecture

| Concern | Approach |
|---------|----------|
| User auth | JWT tokens via Supabase Auth or Clerk |
| API key storage | AES-256 encrypted at rest in Supabase, never exposed to frontend |
| Database access | Row-Level Security (RLS) in Supabase — users can only read their own data |
| Transport | HTTPS everywhere, WSS for WebSockets |
| Kalshi API keys | Server-side only — the browser never touches a raw API key |

Users log in → get JWT → JWT authorizes requests to Railway API server → server uses its own Kalshi credentials to fetch data. User API keys (if needed) are stored encrypted.

---

## Latency Considerations

Kalshi is **not a HFT environment**. Wide spreads, lower volume, event-driven contracts mean:
- Sub-300ms round trip is sufficient
- No co-location needed
- No FIX protocol needed
- Standard HTTPS + WebSocket is fine

Professional HFT tactics (co-location, kernel bypass, FIX) are overkill and inapplicable here. Focus on reliability and UX, not microsecond latency.

---

## Phased Build Plan

### Phase 1 — Working UI (current state)
- [x] Vite + React SPA scaffolded
- [x] Mock scanner, montage, market race components
- [ ] Wire up Kalshi API (RSA-PSS auth, market list, orderbook WS)
- [ ] Replace mock data with real data

### Phase 2 — Core Terminal Features
- [ ] Real-time price ladder (DOM) using `orderbook_delta` WS stream
- [ ] Scanner with configurable filters (volume spike, spread, price move)
- [ ] Time & Sales feed
- [ ] TradingView Lightweight Charts integration

### Phase 3 — Backend + Multi-User
- [ ] Move to Next.js
- [ ] Deploy scanner engine on Railway
- [ ] Supabase for auth + user data
- [ ] Redis pub/sub for market data fan-out
- [ ] Vercel deployment

### Phase 4 — Product Polish
- [ ] User accounts, saved scan configs, watchlists
- [ ] Alert system (email/push on scanner hits)
- [ ] Tauri desktop wrapper (optional)
- [ ] Billing (if going commercial)

---

## Key Reference Files

- `TRADING_TERMINAL_REFERENCES.md` — open source repos for all major subsystems (charting, scanners, price ladder, API patterns)
- Kalshi API spec is in Section 13 of that file (auth, WebSocket, order payload, centi-cents trap)
