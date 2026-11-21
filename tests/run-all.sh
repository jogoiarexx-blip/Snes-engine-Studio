#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo '[1/5] JavaScript syntax'
while IFS= read -r -d '' f; do node --check "$f" >/dev/null; done < <(find "$ROOT/js" -name '*.js' -print0)
echo '[2/5] Stability unit tests'
node "$ROOT/tests/stability-tests.js"
node "$ROOT/tests/integration-tests.js"
node "$ROOT/tests/gameforge-brief.test.js"
node "$ROOT/tests/stage-routes.test.js"
node "$ROOT/tests/gameflow-routes.test.js"
echo '[3/5] Rebuild export sources'
python "$ROOT/tools/build-export-sources.py" >/dev/null
node --check "$ROOT/js/export/export-sources.js" >/dev/null
echo '[4/5] Browser E2E (real Chromium + exported HTML)'
python "$ROOT/tests/browser-e2e.py"
echo '[5/5] HTML boot smoke test'
LOG="$ROOT/tests/chromium-smoke.log"
timeout 15 chromium --headless --no-sandbox --disable-gpu --allow-file-access-from-files --enable-logging=stderr --log-level=1 --dump-dom "file://$ROOT/index.html" > "$ROOT/tests/dom-smoke.html" 2> "$LOG" || true
if grep -E "Uncaught (TypeError|ReferenceError|SyntaxError)|ERR_FILE_NOT_FOUND" "$LOG" >/dev/null; then
  echo 'Browser smoke found critical errors:'
  grep -E "Uncaught (TypeError|ReferenceError|SyntaxError)|ERR_FILE_NOT_FOUND" "$LOG" | head -20
  exit 1
fi
echo 'ALL TESTS PASSED'
