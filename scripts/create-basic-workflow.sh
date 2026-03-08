#!/usr/bin/env bash
# Cria um workflow básico no n8n via API (útil se o MCP estiver com erro de validação).
# Uso: N8N_BASE_URL=http://localhost:5678 N8N_API_KEY=sua_api_key ./scripts/create-basic-workflow.sh
# Ou exporte N8N_BASE_URL e N8N_API_KEY no ambiente.

set -e
BASE="${N8N_BASE_URL:-http://localhost:5678}"
KEY="${N8N_API_KEY:?Defina N8N_API_KEY}"

WORKFLOW='{
  "name": "Workflow Básico",
  "nodes": [
    {
      "id": "trigger-1",
      "name": "Quando eu clicar em Testar",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [240, 300],
      "parameters": {}
    },
    {
      "id": "set-1",
      "name": "Definir dados",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [460, 300],
      "parameters": {
        "mode": "manual",
        "duplicateItem": false,
        "assignments": {
          "assignments": [
            { "id": "msg", "name": "mensagem", "value": "Olá do n8n!", "type": "string" },
            { "id": "ts", "name": "timestamp", "value": "={{ $now.toISO() }}", "type": "string" }
          ]
        }
      }
    }
  ],
  "connections": {
    "Quando eu clicar em Testar": {
      "main": [[{ "node": "Definir dados", "type": "main", "index": 0 }]]
    }
  },
  "settings": { "executionOrder": "v1" }
}'

URL="${BASE%/}/api/v1/workflows"
echo "POST $URL"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-N8N-API-KEY: $KEY" \
  -d "$WORKFLOW")
HTTP_CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d')
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Erro HTTP $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi
echo "Workflow criado com sucesso."
echo "$BODY" | jq -r '.id // .data.id // "?"' | xargs -I {} echo "ID: {}"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
