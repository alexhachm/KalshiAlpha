# Domain: scanner-grids
<!-- Updated 2026-03-09T00:15:00Z by worker-3. Max ~800 tokens. -->

## Key Files
- `src/components/scanners/AlertTrigger.jsx` — Alert rules + history grids with drag reorder
- `src/components/scanners/LiveScanner.jsx` — Live market scanner grid
- `src/components/scanners/HistoricalScanner.jsx` — Historical scanner grid
- `src/hooks/useGridCustomization.js` — Shared hook for column visibility, ordering, resize, appearance, conditional formatting

## Gotchas & Undocumented Behavior
- `useGridCustomization` drag handlers (`onDragEnd`) operate on the FULL `state.columns` array (including hidden columns), NOT `visibleColumns`
- `visibleColumns` is a filtered subset — its indices do NOT match `columns` indices when columns are hidden
- MUST use `grid.columns.findIndex(c => c.key === col.key)` to get the full index for drag operations
- `dragState.overIndex` stores full-column indices, so CSS comparisons must also use full indices

## Patterns That Work
- Full-index pattern for drag: `const fullIdx = grid.columns.findIndex((c) => c.key === col.key)` — used by LiveScanner, HistoricalScanner, AlertTrigger
- `isDragOver` computed as separate const for cleaner JSX class expressions
- `GridSettingsPanel` is the shared settings UI component for all grids

## Testing Strategy
- `npm run build` for compilation check (Vite)
- Verify drag reorder works with all columns visible AND with some hidden
- Check drag-over CSS highlight lands on correct header

## Recent State
- Fixed AlertTrigger drag reorder to use full column indices (was using visible-only indices)
- Both rules grid and history grid headers now match LiveScanner/HistoricalScanner pattern
