#!/bin/bash
cd /home/z/my-project
# `next start` loads .env.local automatically — no manual sourcing needed.
# Memory-limited to avoid sandbox OOM kills.
exec node --max-old-space-size=2048 ./node_modules/.bin/next start -p 3000 -H 0.0.0.0
