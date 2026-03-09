# Domain: docs-quality-index
<!-- Updated 2026-03-09T00:41:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `docs/tool-interaction-index.md` — checked-in markdown ranking all 18 manifest tools
- `src/config/toolManifest.js` — canonical tool manifest (source of truth for tool list)
- `src/components/WindowManager.jsx` — COMPONENTS registry maps type → React component

## Gotchas & Undocumented Behavior
- Login tool is a Placeholder component — renders "(Coming Soon)" only
- Chart uses canvas so grid customization is N/A (not a gap)
- Market Clock is display-only by nature — low interaction score is expected
- COMPONENT_REGISTRY was renamed to COMPONENTS — use COMPONENTS
- `gh pr create` fails from worktree dirs — must cd to main repo

## Patterns That Work
- Use toolManifest.js TOOL_MANIFEST array as the authoritative tool list
- Score on two axes (Feature Completeness + UI Interaction Quality) with transparent checklists
- Include per-tool rationale to make scoring reproducible
- Category averages and cross-cutting gap tables add useful analysis

## Testing Strategy
- `npm run build` — doc is plain markdown, build verifies nothing is broken
- `npm run dev` — dev server starts cleanly
- Manual: verify all 18 manifest types appear in the index

## Recent State
- Initial version created (PR #182). Covers all 18 tools with scoring criteria, rankings, and gap analysis.
