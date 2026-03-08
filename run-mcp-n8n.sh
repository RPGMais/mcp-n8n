#!/bin/bash
# Wrapper para rodar o MCP n8n com env. Use este script como "command" no Cursor se não puder passar env pela UI.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export N8N_BASE_URL="${N8N_BASE_URL:-http://localhost:5678}"
export N8N_API_KEY="${N8N_API_KEY:-}"
exec node "$SCRIPT_DIR/dist/index.js"
