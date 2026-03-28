#!/bin/bash
set -euo pipefail

TASKS_DIR="tasks"
STATUS_DIR="$TASKS_DIR/status"
MANIFEST="$TASKS_DIR/manifest.json"
TASK_TIMEOUT="${TASK_TIMEOUT:-30m}"
CURRENT_TASK=""

# ─── Cleanup on exit ───
cleanup() {
  if [ -n "$CURRENT_TASK" ]; then
    echo "-- Cleaning up lock for task $CURRENT_TASK"
    rmdir "$STATUS_DIR/$CURRENT_TASK.lock" 2>/dev/null || true
  fi
}
trap cleanup EXIT SIGINT SIGTERM

# ─── Timeout command (macOS compatibility) ───
if command -v timeout &>/dev/null; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD="gtimeout"
else
  echo "** 'timeout' not found. Tasks will run without a time limit."
  echo "   Install coreutils for timeout support: brew install coreutils"
  TIMEOUT_CMD=""
fi

# ─── Validation ───
if [ ! -f "$MANIFEST" ]; then
  echo "!! Manifest not found: $MANIFEST"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "!! jq is required. Install it: brew install jq / apt install jq"
  exit 1
fi

if ! command -v claude &>/dev/null; then
  echo "!! claude CLI is required. Install it: npm install -g @anthropic-ai/claude-code"
  exit 1
fi

TASK_COUNT=$(jq '.tasks | length' "$MANIFEST")
if [ "$TASK_COUNT" -eq 0 ]; then
  echo "!! No tasks in manifest."
  exit 1
fi

mkdir -p "$STATUS_DIR"

# ─── Git init ───
if [ ! -d .git ]; then
  git init
  echo "# $(basename "$(pwd)")" > README.md
  git add README.md
  git commit -m "Initial commit"
  echo "-- Initialized git repo with README.md"
elif [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
  echo "# $(basename "$(pwd)")" > README.md
  git add README.md
  git commit -m "Initial commit"
  echo "-- Created initial commit with README.md"
fi

# ─── Detect default branch ───
DEFAULT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")

# ─── Helpers ───
is_done()   { [ -f "$STATUS_DIR/$1.done" ]; }
is_locked() { [ -d "$STATUS_DIR/$1.lock" ]; }

is_stale_lock() {
  local pid_file="$STATUS_DIR/$1.lock/pid"
  if [ -f "$pid_file" ]; then
    local pid
    pid=$(cat "$pid_file")
    if ! kill -0 "$pid" 2>/dev/null; then
      return 0  # PID is dead — lock is stale
    fi
  fi
  return 1
}

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
  mkdir "$STATUS_DIR/$1.lock" 2>/dev/null && echo $$ > "$STATUS_DIR/$1.lock/pid"
}

release_task() {
  rm -f "$STATUS_DIR/$1.lock/pid" 2>/dev/null || true
  rmdir "$STATUS_DIR/$1.lock" 2>/dev/null || true
}

mark_done() {
  touch "$STATUS_DIR/$1.done"
  release_task "$1"
}

# ─── Main loop ───
while true; do
  AVAILABLE=()
  ALL_DONE=true

  while IFS= read -r task_id; do
    if is_done "$task_id"; then
      continue
    fi
    ALL_DONE=false
    if is_locked "$task_id"; then
      # Check for stale locks (process died without cleanup)
      if is_stale_lock "$task_id"; then
        echo "-- Clearing stale lock for task $task_id"
        release_task "$task_id"
      else
        continue
      fi
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

  TASK_ID="${AVAILABLE[0]}"
  TASK_TITLE=$(jq -r --arg id "$TASK_ID" '.tasks[] | select(.id == $id) | .title' "$MANIFEST")

  if ! claim_task "$TASK_ID"; then
    echo "-- Task $TASK_ID was claimed by another agent. Retrying..."
    continue
  fi
  CURRENT_TASK="$TASK_ID"

  echo ""
  echo "========================================"
  echo ">>  Task $TASK_ID: $TASK_TITLE"
  echo "========================================"
  echo ""

  # Branch for isolation — always start fresh from default branch
  BRANCH="task/${TASK_ID}"
  git checkout "$DEFAULT_BRANCH" 2>/dev/null
  git pull --ff-only 2>&1 || echo "-- git pull skipped (no remote or not fast-forwardable)"
  git branch -D "$BRANCH" 2>/dev/null || true
  git checkout -b "$BRANCH"

  # Execute
  CLAUDE_CMD=(claude --dangerously-skip-permissions --model claude-sonnet-4-6 -p "/execute $TASK_ID")
  if [ -n "$TIMEOUT_CMD" ]; then
    RUN_CMD=("$TIMEOUT_CMD" "$TASK_TIMEOUT" "${CLAUDE_CMD[@]}")
  else
    RUN_CMD=("${CLAUDE_CMD[@]}")
  fi
  if "${RUN_CMD[@]}"; then
    if is_done "$TASK_ID"; then
      echo ""
      echo "-- Merging $BRANCH to $DEFAULT_BRANCH..."
      git checkout "$DEFAULT_BRANCH"
      if git merge "$BRANCH" --no-ff -m "merge task $TASK_ID: $TASK_TITLE"; then
        git branch -d "$BRANCH" 2>/dev/null || true
        echo "** Task $TASK_ID complete and merged."
      else
        echo "!! Merge conflict on task $TASK_ID. Resolve manually then run again."
        release_task "$TASK_ID"
        CURRENT_TASK=""
        exit 1
      fi
    else
      echo "-- Task $TASK_ID: agent exited without completing. Committing partial work."
      git add -A && git commit -m "task $TASK_ID: partial progress" --allow-empty 2>/dev/null || true
      git checkout "$DEFAULT_BRANCH"
      git merge "$BRANCH" --no-ff -m "partial: task $TASK_ID" 2>/dev/null || true
      git branch -d "$BRANCH" 2>/dev/null || true
      release_task "$TASK_ID"
    fi
  else
    echo "!! Task $TASK_ID: agent timed out or errored."
    git checkout "$DEFAULT_BRANCH" 2>/dev/null
    git branch -D "$BRANCH" 2>/dev/null || true
    release_task "$TASK_ID"
  fi
  CURRENT_TASK=""
done
