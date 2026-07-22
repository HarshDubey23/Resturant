#!/bin/bash
# Ensures the Next.js server is running. Starts it if dead.
# Usage: source /home/z/my-project/scripts/ensure-server.sh

cd /home/z/my-project

# Check if server is alive on port 3000
if ! curl -s --max-time 3 -o /dev/null http://127.0.0.1:3000/api/health 2>/dev/null; then
    echo "[ensure-server] Server not responding, restarting..." >&2
    pkill -9 -f "next" 2>/dev/null
    sleep 2
    nohup /home/z/my-project/scripts/start-prod.sh > /tmp/dev.log 2>&1 < /dev/null &
    disown
    # Wait for it to bind
    for i in {1..15}; do
        if curl -s --max-time 2 -o /dev/null http://127.0.0.1:3000/api/health 2>/dev/null; then
            echo "[ensure-server] Server is up (after ${i}s)" >&2
            break
        fi
        sleep 1
    done
fi
