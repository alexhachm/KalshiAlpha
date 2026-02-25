#!/usr/bin/env bash
# Launch a worker terminal on demand (called by Master-3/Master-2)
# Usage: launch-worker.sh <worker-number>
# Returns immediately (non-blocking). The worker terminal runs /worker-loop.
#
# v4: No dependency on .sh launcher files. Uses .ps1 on Windows, inline commands elsewhere.
set -e

WORKER_NUM="$1"
if [ -z "$WORKER_NUM" ]; then
    echo "Usage: launch-worker.sh <worker-number>" >&2
    exit 1
fi

# Resolve project directory (script lives at .claude/scripts/)
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
WORKTREE="$PROJECT_DIR/.worktrees/wt-$WORKER_NUM"

# Verify worktree exists
if [ ! -d "$WORKTREE" ]; then
    echo "ERROR: Worktree not found: $WORKTREE" >&2
    exit 1
fi

# The inline command to run claude in the worker worktree
WORKER_CMD="export PATH=\"\$HOME/bin:\$HOME/.local/bin:\$PATH\"; cd '$WORKTREE' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model opus --dangerously-skip-permissions '/worker-loop'"

# Platform-specific terminal launch (non-blocking)
if [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* ]]; then
    # Windows: prefer .ps1 launcher, fallback to inline wsl.exe command
    PS1_FILE="$PROJECT_DIR/.claude/launchers/worker-${WORKER_NUM}.ps1"

    if [ -f "$PS1_FILE" ]; then
        WIN_PS1=$(cygpath -w "$PS1_FILE" 2>/dev/null || echo "$PS1_FILE" | sed 's|/|\\|g')
        if command -v wt.exe &>/dev/null; then
            wt.exe new-tab --title "Worker-$WORKER_NUM" powershell.exe -ExecutionPolicy Bypass -File "$WIN_PS1" &
        else
            start powershell.exe -ExecutionPolicy Bypass -File "$WIN_PS1" &
        fi
    else
        # No .ps1 — build inline wsl.exe command
        WSL_WORKTREE=$(echo "$WORKTREE" | sed 's|^/\([a-zA-Z]\)/|/mnt/\1/|')
        INLINE_CMD="export PATH=\"\$HOME/bin:\$HOME/.local/bin:\$PATH\"; cd '$WSL_WORKTREE' && env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude --model opus --dangerously-skip-permissions '/worker-loop'"
        if command -v wt.exe &>/dev/null; then
            wt.exe new-tab --title "Worker-$WORKER_NUM" wsl.exe bash -lc "$INLINE_CMD" &
        else
            start wsl.exe bash -lc "$INLINE_CMD" &
        fi
    fi

elif [[ "$OSTYPE" == darwin* ]]; then
    # macOS: build inline command, open in Terminal.app
    osascript -e "tell application \"Terminal\"
        activate
        do script \"$WORKER_CMD\"
    end tell" &

else
    # Linux: build inline command, try common terminal emulators
    if command -v gnome-terminal &>/dev/null; then
        gnome-terminal --title="Worker-$WORKER_NUM" -- bash -lc "$WORKER_CMD; exec bash" &
    elif command -v konsole &>/dev/null; then
        konsole --new-tab -e bash -lc "$WORKER_CMD; exec bash" &
    elif command -v xterm &>/dev/null; then
        xterm -title "Worker-$WORKER_NUM" -e bash -lc "$WORKER_CMD; exec bash" &
    else
        echo "WARN: No supported terminal emulator found. Run manually:" >&2
        echo "  bash -lc \"$WORKER_CMD\"" >&2
        exit 1
    fi
fi

echo "[LAUNCH_WORKER] worker-$WORKER_NUM terminal opened"
