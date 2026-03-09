# Domain: worker-loop-contract
<!-- Updated 2026-03-09T01:16:00Z by worker-1. Max ~800 tokens. -->

## Key Files
- `.claude/commands/worker-loop.md` — the active worker-loop instructions loaded as a slash command
- `.claude/commands-codex10/worker-loop.md` — the codex10 reference template (source of truth for contract semantics)
- `.claude/scripts/codex10` — wrapper around mac10 binary with `MAC10_NAMESPACE="codex10"`
- `.claude/scripts/mac10` — legacy CLI wrapper (still exists for backward compat)
- `CLAUDE.md` — worker identity config; still references some legacy state-file patterns (not yet migrated)

## Gotchas & Undocumented Behavior
- `codex10` and `mac10` are both wrappers around the same `mac10` binary in `setup-agents-codex10/coordinator/bin/mac10` — only the namespace differs
- The `state-lock.sh` helper validates JSON; it warns on markdown files but still appends content
- `gh` CLI doesn't work from git worktree directories — must `cd` to main repo or use `GIT_DIR`
- CLAUDE.md is injected into conversation context automatically and still has legacy mac10 references

## Patterns That Work
- When migrating instructions: use the codex10 template as base, preserve YAML frontmatter and any extra sections (like Agent Teams) from the legacy file
- Verify no secrets in diff before committing (grep for api_key, token, password, etc.)
- Stage only the specific files you changed (avoid `git add -A` which picks up state/build artifacts)

## Testing Strategy
- `npm run build` for build validation (this is a docs-only domain, build should always pass)
- Verify no `mac10` references remain in the output file when migrating to codex10
- Check all 4 success criteria explicitly against the diff

## Recent State
- worker-loop.md fully migrated to codex10 semantics (PR #188)
- CLAUDE.md still has legacy references (signal files, state files table, worker-status.json) — potential future task
