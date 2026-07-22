#!/bin/bash
# Persistent Next.js dev server launcher
# Uses port 3000 so the workspace Caddy preview proxy can route to it

cd /home/z/my-project/Resturant

# Kill any stale next processes
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 2

# Start dev server — use exec to replace the shell so signals go directly to next
exec node ./node_modules/next/dist/bin/next dev -p 3000 --hostname 0.0.0.0
