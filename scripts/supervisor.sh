#!/bin/bash
# Fully-detached auto-restarting supervisor for Next.js
# Uses setsid + nohup + disown to survive parent shell exits

cd /home/z/my-project

LOGFILE=/tmp/dev.log

# Clean up any stale state
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next start" 2>/dev/null
pkill -9 -f "supervisor.sh" 2>/dev/null
sleep 2

echo "[supervisor] Starting at $(date)" > "$LOGFILE"

# Trap signals — ignore them so we don't die with parent
trap '' SIGHUP SIGINT SIGTERM SIGQUIT

# Infinite restart loop
while true; do
    echo "[supervisor] $(date): Starting Next.js..." >> "$LOGFILE"
    node --max-old-space-size=2048 ./node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> "$LOGFILE" 2>&1
    EXIT_CODE=$?
    echo "[supervisor] $(date): Next.js exited (code=$EXIT_CODE). Restart in 3s..." >> "$LOGFILE"
    sleep 3
    pkill -9 -f "next-server" 2>/dev/null
    sleep 1
done
