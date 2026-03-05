#!/bin/sh
# Simple launcher for the single‑page application (SPA) in this directory.
# It starts a lightweight HTTP server on port 8000 so that
# service workers and the manifest work correctly.

# You can change the port by setting the PORT environment variable:
#   PORT=3000 ./start.sh

port=${PORT:-8000}

printf "Serving %s on http://localhost:%s
" "$PWD" "$port"

# prefer python3 if available, otherwise fall back to python
if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$port"
else
    exec python -m SimpleHTTPServer "$port"
fi
