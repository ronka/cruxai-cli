#!/usr/bin/env bash
# replay-submission.sh — Replay submission e6899414 messages against a given invite.
#
# Usage:
#   ./scripts/replay-submission.sh <invite-id>
#
# Requirements:
#   - agent-browser installed (npm i -g agent-browser)
#   - DATABASE_URL env var set (or sourced from .env.local)
#   - App running at http://localhost:3000

set -euo pipefail

APP_URL="http://localhost:3000"
RECRUITER_EMAIL="ronkamail@gmail.com"
RECRUITER_PASSWORD="u1rx42c5"
SESSION="replay-$$"

INVITE_CODE="${1:?Usage: $0 <invite-id>}"
echo "   Code: $INVITE_CODE"

# Messages from submission e6899414-6cbd-42dc-90a7-145ffd00a18c
MESSAGES_JSON=$(python3 << 'PYEOF'
import json
messages = [
    "im currently seeing a loading screen. what is causing it?",
    "Load initialBoard into Redux on app start",
    "Extend an existing Monday.com-style board by adding an estimations column that accepts and normalizes shorthand time notation",
    "explain what shorthand time notation is",
    "so what is the correct format? 1h 15m or 1:15?",
    "given that standard, validate the normalizeEstimation you wrote",
    """the shows loading state before board data arrives is failing on: TestingLibraryElementError: Unable to find an element by: [data-testid="board-loading"]

    at Object.getElementError (/vercel/sandbox/node_modules/@testing-library/dom/dist/config.js:37:19)

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:76:38

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:52:17

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:95:19

    at Object.<anonymous> (/vercel/sandbox/tests/sorting.spec.tsx:97:17)

    at Promise.finally.completed (/vercel/sandbox/node_modules/
loads board data from the API on mount, not from hardcoded initial data
41ms
Error: expect(jest.fn()).toHaveBeenCalledTimes(expected)

    at Object.<anonymous> (/vercel/sandbox/tests/sorting.spec.tsx:103:29)
calls addTask API when a task is added
204ms
TypeError: (0 , boardSlice_1.addTask) is not a function

    at addTask (/vercel/sandbox/src/components/board/BoardView.tsx:41:27)

    at onAddTask (/vercel/sandbox/src/components/board/BoardView.tsx:75:30)""",
    """the shows loading state before board data arrives is failing on: TestingLibraryElementError: Unable to find an element by: [data-testid="board-loading"]

    at Object.getElementError (/vercel/sandbox/node_modules/@testing-library/dom/dist/config.js:37:19)

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:76:38

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:52:17

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:95:19

    at Object.<anonymous> (/vercel/sandbox/tests/sorting.spec.tsx:97:17)

    at Promise.finally.completed (/vercel/sandbox/node_modules/""",
    "the loads board data from the API on mount, not from hardcoded initial data test fails on : Error: expect(jest.fn()).toHaveBeenCalledTimes(expected)\n\n    at Object.<anonymous> (/vercel/sandbox/tests/sorting.spec.tsx:103:29)",
    "yes",
    """the calls updateTask API with raw user input when estimation is saved fails on TestingLibraryElementError: Unable to find an accessible element with the role "textbox"

    at Object.getElementError (/vercel/sandbox/node_modules/@testing-library/dom/dist/config.js:37:19)

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:76:38

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:52:17

    at /vercel/sandbox/node_modules/@testing-library/dom/dist/query-helpers.js:95:19

    at Object.<anonymous> (/vercel/sandbox/tests/sorting.spec.tsx:228:33)""",
    "it still fails. can there be a nother reason",
    "implement the fix",
]
print(json.dumps(messages))
PYEOF
)

MSG_COUNT=$(echo "$MESSAGES_JSON" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')

# ----- helpers ---------------------------------------------------------------

# Sleep using agent-browser's wait (browser-aware), silently.
ab_wait() {
  agent-browser --session "$SESSION" wait "$1" >/dev/null 2>&1 || true
}

# Take a snapshot, never failing the pipeline.
ab_snapshot() {
  agent-browser --session "$SESSION" snapshot -i 2>/dev/null || true
}

# Extract first ref id matching an extended regex, never failing the pipeline.
extract_ref() {
  local snapshot="$1" pattern="$2"
  printf '%s\n' "$snapshot" | grep -oE "$pattern" | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=//' || true
}

# Returns 0 if a "Stop" button is currently visible (AI is streaming).
# Uses the accessibility snapshot so icon-only buttons (label via aria-label,
# not textContent) are detected correctly.
ai_is_streaming() {
  ab_snapshot | grep -qE 'button "Stop"'
}

# Block until AI is idle (no Stop button) for `stable_s` consecutive seconds,
# or until `timeout_s` elapses. Returns 1 on timeout.
wait_until_ai_idle() {
  local timeout_s="${1:-300}" stable_s="${2:-2}"
  local elapsed=0 stable=0
  while (( elapsed < timeout_s )); do
    if ai_is_streaming; then
      stable=0
    else
      stable=$((stable + 1))
      if (( stable >= stable_s )); then
        return 0
      fi
    fi
    ab_wait 1000
    elapsed=$((elapsed + 1))
  done
  return 1
}

# After a Submit click: wait briefly for streaming to *start* (Stop appears),
# then wait for it to finish. Tolerates very fast responses where Stop never
# becomes visible.
wait_for_ai_response() {
  local appeared=0
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if ai_is_streaming; then appeared=1; break; fi
    ab_wait 500
  done
  if (( appeared == 1 )); then
    wait_until_ai_idle 600 2 || {
      echo "   WARNING: AI still streaming after 10min" >&2
      return 1
    }
  fi
  # Let the DOM settle so the input remounts before next snapshot.
  ab_wait 1500
}

# Find textarea + Submit refs with retry. Sets globals TEXTAREA_REF / SUBMIT_REF.
find_input_refs() {
  local max_tries="${1:-15}" snapshot
  for try in $(seq 1 "$max_tries"); do
    snapshot=$(ab_snapshot)
    TEXTAREA_REF=$(extract_ref "$snapshot" 'textbox[^)]*\[ref=e[0-9]+\]')
    SUBMIT_REF=$(extract_ref "$snapshot"  'button "Submit"[^)]*\[ref=e[0-9]+\]')
    if [[ -n "$TEXTAREA_REF" && -n "$SUBMIT_REF" ]]; then
      return 0
    fi
    ab_wait 1500
  done
  return 1
}

# Dump diagnostics on failure: snapshot head + screenshot.
dump_failure() {
  local tag="$1"
  echo "   ---- snapshot (head) ----" >&2
  ab_snapshot | head -60 >&2 || true
  echo "   -------------------------" >&2
  local png="/tmp/replay-${tag}-$$.png"
  agent-browser --session "$SESSION" screenshot "$png" 2>/dev/null || true
  echo "   Screenshot: $png" >&2
}

# Navigate to the invite page
echo "==> Opening invite page..."
agent-browser --session "$SESSION" open "$APP_URL/invite/$INVITE_CODE"
agent-browser --session "$SESSION" wait --load networkidle
agent-browser --session "$SESSION" wait 3000

# Accept Terms of Service
echo "==> Accepting Terms of Service..."
agent-browser --session "$SESSION" eval "window.scrollTo(0, document.body.scrollHeight)" 2>/dev/null || true
agent-browser --session "$SESSION" wait 500
find_checkbox_ref() {
  echo "$1" | grep -E '^\s*-?\s*checkbox\b.*"I accept' | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=//' || true
}
SNAPSHOT=$(agent-browser --session "$SESSION" snapshot -i 2>/dev/null)
CHECKBOX_REF=$(find_checkbox_ref "$SNAPSHOT")
if [[ -z "$CHECKBOX_REF" ]]; then
  echo "   WARNING: ToS checkbox not found in snapshot, waiting 2s and retrying..." >&2
  agent-browser --session "$SESSION" wait 2000
  SNAPSHOT=$(agent-browser --session "$SESSION" snapshot -i 2>/dev/null)
  CHECKBOX_REF=$(find_checkbox_ref "$SNAPSHOT")
fi
if [[ -z "$CHECKBOX_REF" ]]; then
  echo "   ERROR: Could not find ToS checkbox" >&2
  echo "   Snapshot dump:" >&2
  echo "$SNAPSHOT" | head -80 >&2
  agent-browser --session "$SESSION" screenshot "/tmp/replay-checkbox-fail-$$.png" 2>/dev/null || true
  echo "   Screenshot saved to /tmp/replay-checkbox-fail-$$.png" >&2
  exit 1
fi
agent-browser --session "$SESSION" click "$CHECKBOX_REF"
agent-browser --session "$SESSION" wait 500

# Click "Start Assignment"
echo "==> Clicking Start Assignment..."
agent-browser --session "$SESSION" scroll down 2>/dev/null || \
  agent-browser --session "$SESSION" eval "window.scrollTo(0, document.body.scrollHeight)" 2>/dev/null || true
agent-browser --session "$SESSION" wait 500
SNAPSHOT=$(agent-browser --session "$SESSION" snapshot -i 2>/dev/null)
START_REF=$(echo "$SNAPSHOT" | grep -iE 'button "[^"]*start[^"]*"[^)]*\[ref=e[0-9]+\]' | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=//' || true)
if [[ -z "$START_REF" ]]; then
  echo "   WARNING: Start Assignment button not found, waiting 3s..." >&2
  agent-browser --session "$SESSION" wait 3000
  SNAPSHOT=$(agent-browser --session "$SESSION" snapshot -i 2>/dev/null)
  START_REF=$(echo "$SNAPSHOT" | grep -iE 'button "[^"]*start[^"]*"[^)]*\[ref=e[0-9]+\]' | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=//' || true)
fi
if [[ -n "$START_REF" ]]; then
  agent-browser --session "$SESSION" click "$START_REF"
  agent-browser --session "$SESSION" wait --load networkidle
  agent-browser --session "$SESSION" wait 3000
else
  echo "   ERROR: Could not find Start Assignment button" >&2
  echo "   Buttons found in snapshot:" >&2
  echo "$SNAPSHOT" | grep -oE 'button "[^"]+"' >&2 || echo "   (none)" >&2
  agent-browser --session "$SESSION" screenshot "/tmp/replay-start-fail-$$.png" 2>/dev/null || true
  echo "   Screenshot saved to /tmp/replay-start-fail-$$.png" >&2
  exit 1
fi

# Replay messages one by one
echo ""
echo "==> Replaying $MSG_COUNT messages..."
for i in $(seq 0 $((MSG_COUNT - 1))); do
  MSG=$(echo "$MESSAGES_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[$i], end='')")
  PREVIEW="${MSG:0:70}"
  echo "   [$((i+1))/$MSG_COUNT] ${PREVIEW//$'\n'/ }..."

  # Make sure the previous response is fully done before reading the DOM.
  if ! wait_until_ai_idle 600 2; then
    echo "   ERROR: AI still streaming after 10min before sending msg $((i+1))" >&2
    dump_failure "stuck-$i"
    exit 1
  fi

  if ! find_input_refs 15; then
    echo "   ERROR: textarea/Submit refs not found after retries for msg $((i+1))" >&2
    echo "          TEXTAREA_REF='$TEXTAREA_REF' SUBMIT_REF='$SUBMIT_REF'" >&2
    dump_failure "noinput-$i"
    exit 1
  fi

  if ! agent-browser --session "$SESSION" fill "$TEXTAREA_REF" "$MSG"; then
    echo "   ERROR: fill failed (ref=$TEXTAREA_REF) for msg $((i+1))" >&2
    dump_failure "fill-$i"
    exit 1
  fi
  if ! agent-browser --session "$SESSION" click "$SUBMIT_REF"; then
    echo "   ERROR: click failed (ref=$SUBMIT_REF) for msg $((i+1))" >&2
    dump_failure "click-$i"
    exit 1
  fi

  echo "   Waiting for AI response..."
  wait_for_ai_response || true
done

# Submit the session
echo ""
echo "==> Submitting session..."
wait_until_ai_idle 600 2 || echo "   WARNING: AI still streaming, submitting anyway" >&2
SNAPSHOT=$(ab_snapshot)
FINISH_REF=$(extract_ref "$SNAPSHOT" 'button "(Submit|Finish|End)[^"]*"[^)]*\[ref=e[0-9]+\]')
if [[ -n "$FINISH_REF" ]]; then
  agent-browser --session "$SESSION" click "$FINISH_REF"
  agent-browser --session "$SESSION" wait --load networkidle
  ab_wait 3000
else
  echo "   WARNING: Submit/Finish button not found in snapshot" >&2
fi

agent-browser --session "$SESSION" screenshot "/tmp/replay-done-$$".png 2>/dev/null || true
echo ""
echo "==================================================="
echo "REPLAY COMPLETE — waiting for recruiter approval"
echo "==================================================="
echo "Invite:   $INVITE_CODE"
echo "==================================================="

agent-browser --session "$SESSION" close 2>/dev/null || true
