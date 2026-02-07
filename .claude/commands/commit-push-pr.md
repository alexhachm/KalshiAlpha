---
description: Ship completed work with error handling.
---

1. `git add -A`
2. `git diff --cached --stat`
3. **Secret check:** `git diff --cached` — ABORT if you see API keys, tokens, passwords, .env values, or private keys in the diff. Say "BLOCKED: secrets detected in diff" and do NOT proceed.
4. `git commit -m "type(scope): description"`
5. Push with retry:
   ```bash
   git push origin HEAD || (git pull --rebase origin HEAD && git push origin HEAD)
   ```
   If push still fails, say "ERROR: push failed — may need manual conflict resolution" and report the error.
6. Create PR with retry:
   ```bash
   gh pr create --base $(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main) --fill 2>&1
   ```
   If `gh pr create` fails (e.g., PR already exists), try: `gh pr view --web 2>/dev/null` to get the existing PR URL.
   If that also fails, report the error and the branch name so the user can create the PR manually.
7. Report PR URL
