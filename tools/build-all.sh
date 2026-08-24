#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo '[build] export sources'
python tools/build-export-sources.py
echo '[build] syntax + unit + browser smoke'
bash tests/run-all.sh
echo '[build] done'
