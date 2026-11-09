#!/bin/bash
set -e
cd /app
echo "Starting ARGUS Risk Engine..."
uvicorn argus.serve:app \
    --app-dir services/risk-engine/src \
    --host 127.0.0.1 \
    --port 8000 &
RISK_PID=$!
cleanup() {
    echo "Stopping ARGUS services..."
    kill "$RISK_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
echo "Starting ARGUS Express Gateway..."
cd /app/app/server
export PORT="${PORT:-10000}"
export RISK_ENGINE_URL="http://127.0.0.1:8000"
node dist/index.js
