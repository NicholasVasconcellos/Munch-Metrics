#!/bin/bash
set -euo pipefail

TASKS_DIR="tasks"
STATUS_DIR="$TASKS_DIR/status"
MANIFEST="$TASKS_DIR/manifest.json"
TASK_TIMEOUT="${TASK_TIMEOUT:-30m}"

# ─── Validation ───
if [ ! -f "$MANIFEST" ]; then
  echo "!! Manifest not found: $MANIFEST"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "!! jq is required. Install it: brew install jq / apt install jq"
  exit 1
fi

mkdir -p "$STATUS_DIR"

# ─── Helpers ───
is_done()   { [ -f "$STATUS_DIR/$1.done" ]; }
is_locked() { [ -d "$STATUS_DIR/$1.lock" ]; }

deps_met() {
  local task_id="$1"
  local deps
  deps=$(jq -r --arg id "$task_id" '.tasks[] | select(.id == $id) | .depends_on[]' "$MANIFEST" 2>/dev/null)
  for dep in $deps; do
    is_done "$dep" || return 1
  done
  return 0
}

claim_task() {
  mkdir "$STATUS_DIR/$1.lock" 2>/dev/null
}

release_task() {
  rmdir "$STATUS_DIR/$1.lock" 2>/dev/null || true
}

mark_done() {
  touch "$STATUS_DIR/$1.done"
  release_task "$1"
}

# ─── Main loop ───
while true; do
  # Collect all available tasks (deps met, not done, not locked)
  AVAILABLE=()
  ALL_DONE=true

  while IFS= read -r task_id; do
    if is_done "$task_id"; then
      continue
    fi
    ALL_DONE=false
    if is_locked "$task_id"; then
      continue
    fi
    if deps_met "$task_id"; then
      AVAILABLE+=("$task_id")
    fi
  done < <(jq -r '.tasks[].id' "$MANIFEST")

  if [ "$ALL_DONE" = true ]; then
    echo ""
    echo "========================================"
    echo "  All tasks complete!"
    echo "========================================"
    exit 0
  fi

  if [ ${#AVAILABLE[@]} -eq 0 ]; then
    echo "-- No tasks available (dependencies pending or locked by another agent). Waiting 30s..."
    sleep 30
    continue
  fi

  # Grab the first available task
  TASK_ID="${AVAILABLE[0]}"
  TASK_TITLE=$(jq -r --arg id "$TASK_ID" '.tasks[] | select(.id == $id) | .title' "$MANIFEST")

  if ! claim_task "$TASK_ID"; then
    echo "-- Task $TASK_ID was claimed by another agent. Retrying..."
    continue
  fi

  echo ""
  echo "========================================"
  echo ">>  Task $TASK_ID: $TASK_TITLE"
  echo "========================================"
  echo ""

  # Branch for isolation
  BRANCH="task/${TASK_ID}"
  git checkout main 2>/dev/null || git checkout master 2>/dev/null
  git pull --ff-only 2>/dev/null || true
  git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

  # Execute
  if timeout "$TASK_TIMEOUT" claude --dangerously-skip-permissions --model claude-sonnet-4-latest --no-thinking -p "/execute $TASK_ID"; then
    # Check if agent marked it done
    if is_done "$TASK_ID"; then
      echo ""
      echo "-- Merging $BRANCH to main..."
      git checkout main 2>/dev/null || git checkout master 2>/dev/null
      if git merge "$BRANCH" --no-ff -m "merge task $TASK_ID: $TASK_TITLE"; then
        git branch -d "$BRANCH" 2>/dev/null || true
        echo "** Task $TASK_ID complete and merged."
      else
        echo "!! Merge conflict on task $TASK_ID. Resolve manually then run again."
        release_task "$TASK_ID"
        exit 1
      fi
    else
      # Agent exited (context limit) but didn't finish — task stays available
      echo "-- Task $TASK_ID: agent exited without completing. Committing partial work."
      git add -A && git commit -m "task $TASK_ID: partial progress" --allow-empty 2>/dev/null || true
      git checkout main 2>/dev/null || git checkout master 2>/dev/null
      git merge "$BRANCH" --no-ff -m "partial: task $TASK_ID" 2>/dev/null || true
      git branch -d "$BRANCH" 2>/dev/null || true
      release_task "$TASK_ID"
    fi
  else
    echo "!! Task $TASK_ID: agent timed out or errored."
    git checkout main 2>/dev/null || git checkout master 2>/dev/null
    git branch -D "$BRANCH" 2>/dev/null || true
    release_task "$TASK_ID"
  fi
done
