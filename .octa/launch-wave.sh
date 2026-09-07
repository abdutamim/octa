#!/usr/bin/env bash
# Usage: .octa/launch-wave.sh 001 005 012
# Creates a git worktree per spec (branch spec-NNN from main), runs the Luna worker in each in parallel, waits for all.
set -u
ROOT="C:/Users/Admin/Desktop/Projects/octa"; cd "$ROOT" || exit 2
mkdir -p .octa/worktrees .octa/logs
pids=()
for ID in "$@"; do
  WT="$ROOT/.octa/worktrees/spec-$ID"
  if [ ! -d "$WT" ]; then
    git branch -f "spec-$ID" main >/dev/null 2>&1
    git worktree add -f "$WT" "spec-$ID" >/dev/null 2>&1 || { echo "worktree failed for $ID"; continue; }
    # node_modules are not tracked: link the root install so npm test works without a fresh install
    [ -d "$ROOT/node_modules" ] && [ ! -e "$WT/node_modules" ] && cmd //c mklink //J "$(cygpath -w "$WT/node_modules")" "$(cygpath -w "$ROOT/node_modules")" >/dev/null
  fi
  ( bash "$ROOT/.octa/run-worker.sh" "$ID" "$WT" ) &
  pids+=($!)
  echo "started spec-$ID pid=$! in $WT"
done
wait "${pids[@]}"
echo "wave done: $*"; cat "$ROOT/.octa/logs/workers.txt" | tail -n "$#"
