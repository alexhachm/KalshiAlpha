# Domain: frontend/changes
<!-- Updated 2026-03-07T20:25:00Z by worker-5. Max ~800 tokens. -->

## Key Files
- `src/components/trade/ChangesTab.jsx` — Main component: live feed of iteration engine changes
- `src/components/trade/ChangesTab.css` — Bloomberg-style CSS (pill badges, compact rows, dark theme)
- `src/services/changeTrackingService.js` — Mock service: getChanges(), subscribeToChanges(cb), getChangeById(id)
- `src/components/WindowManager.jsx` — Registered as `changes` type in COMPONENT_REGISTRY
- `src/components/MenuBar.jsx` — Listed under Trade menu

## Gotchas & Undocumented Behavior
- changeTrackingService uses a module-level setInterval for live updates — it runs as long as the app is mounted
- Tooltip uses mouseenter delay (400ms) to avoid flicker; closes on mousedown outside
- `gh pr create` fails from worktree dirs — must cd to main repo dir first

## Patterns That Work
- Follow EventLog/TradeLog patterns: toolbar + entries container + settings panel
- Use `ct-` CSS class prefix (consistent with `el-` for EventLog, `tl-` for TradeLog)
- Status badges: pill-shaped with color-mix backgrounds matching existing level badges
- CSS vars from index.css (:root) — never hardcode colors

## Testing Strategy
- Build check: `npm run build` (Vite, ~20s)
- Dev server: `npm run dev` — check for module resolution errors
- Manual: Open Trade > Changes from menu, verify entries render, test filters/diff/tooltip

## Recent State
- Initial implementation complete with all required features
- Mock service generates periodic new changes every 15-25s
- PR #85 created
