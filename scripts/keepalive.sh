#!/bin/bash
# Immortal supervisor - survives everything
trap '' SIGHUP SIGINT SIGTERM SIGQUIT
cd /home/z/my-project
echo "[$(date)] keepalive started, pid=$$" > /tmp/keepalive.log
while true; do
    echo "[$(date)] Starting next..." >> /tmp/keepalive.log
    node --max-old-space-size=1024 ./node_modules/.bin/next start -p 3000 -H 0.0.0.0 >> /tmp/dev.log 2>&1
    EXIT=$?
    echo "[$(date)] Exited code=$EXIT. Restart in 2s..." >> /tmp/keepalive.log
    sleep 2
done
