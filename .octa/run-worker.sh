#!/usr/bin/env bash
# Usage: .octa/run-worker.sh <spec-id e.g. 000> [<worktree-dir>]
# Runs GPT-5.6 Luna (max reasoning, fast mode) headless on .octa/tasks/spec-<id>.md
# inside the given worktree (default: repo root). Log: .octa/logs/spec-<id>.jsonl
set -u
ID="$1"; ROOT="C:/Users/Admin/Desktop/Projects/octa"; DIR="${2:-$ROOT}"
TASK="$ROOT/.octa/tasks/spec-$ID.md"; LOG="$ROOT/.octa/logs/spec-$ID.jsonl"
[ -f "$TASK" ] || { echo "no task $TASK"; exit 2; }
cd "$DIR" || exit 2
{
  echo "You are the coding agent for Octa. Read AGENTS.md in the current directory first and follow it exactly."
  echo "Your task file follows. Work only in the current directory (a git checkout of the octa repo on branch $(git rev-parse --abbrev-ref HEAD))."
  echo; echo "----- TASK -----"; cat "$TASK"; echo "----- END TASK -----"
  echo; echo "When completely finished (typecheck + tests green, committed, report written), print the single line OCTA_DONE."
} | codex exec --json -m gpt-5.6-luna \
    -c 'model_reasoning_effort="max"' -c 'service_tier="priority"' -c 'features.fast_mode=true' \
    -c 'approval_policy="never"' -s workspace-write -C "$DIR" \
    --add-dir "C:/Users/Admin/Desktop/Projects/tamim-os" \
    --add-dir "C:/Users/Admin/Documents/Codex/2026-08-15/c-users-admin-appdata-local-programs/work/octa-code-backend-final-20260830" \
    --skip-git-repo-check --color never - > "$LOG" 2>&1
RC=$?
echo "spec-$ID exit=$RC" >> "$ROOT/.octa/logs/workers.txt"
exit $RC
