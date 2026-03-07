# Domain: services/loop
<!-- Updated 2026-03-07T20:36:00Z by worker-6. Max ~800 tokens. -->

## Key Files
- `src/services/researchLoop.js` — Loop engine: enumerateCodebaseFunctions, auditFunction, prioritizeImprovements, generateChangeEntry, fetchResearchSuggestions, RESEARCH_SOURCES
- `.claude/scripts/research-loop-prompt.md` — mac10 loop agent prompt template
- `src/services/changeTrackingService.js` — Change log (localStorage-backed, subscriber pattern)
- `src/services/auditStateService.js` — Audit state (Map keyed by filePath::functionName, localStorage-backed)

## Gotchas & Undocumented Behavior
- researchLoop.js uses dynamic `import('fs')` for Node.js context (mac10 loop agent), but is also importable in browser (browser-only functions like parseFunctionExports work fine)
- auditStateService uses `new Map(JSON.parse(raw))` for deserialization — entries must be [key, value] pairs
- The `dist/` folder has pre-built artifacts checked in — don't include in PRs
- Worker sentinel/mac10 scripts are in .claude/scripts/ and may be untracked

## Patterns That Work
- Follow the localStorage + subscriber pattern from settingsStore/alertService
- Export via named exports at bottom (`export { fn1, fn2 }`)
- Use function declarations (not arrow functions) for top-level functions
- parseFunctionExports handles: export default, React.memo wraps, named exports, export function/const

## Testing Strategy
- `npm run build` — verifies all imports resolve
- Dev server (`npm run dev`) — verifies runtime module resolution
- For researchLoop specifically: run enumerateCodebaseFunctions() in Node to verify it finds all exports

## Recent State
- Both files are new (PR #87). fetchResearchSuggestions stubs return empty arrays — ready for real implementation when API keys are available.
