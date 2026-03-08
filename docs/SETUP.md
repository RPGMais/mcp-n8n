# Setup — mcp-n8n

## Prerequisites

- **Node.js** 18+ (Node 16 is supported with http/https fallback, but 18+ is recommended)
- **n8n** instance running and accessible (e.g., `http://localhost:5678`)
- **n8n API key** — create one in **Settings > n8n API** in your n8n instance

---

## Installation

The recommended way to run mcp-n8n is via **npx** — no local installation required:

```bash
npx -y @nextoolsolutions/mcp-n8n
```

For local development, clone and install:

```bash
git clone https://github.com/RPGMais/mcp-n8n.git
cd mcp-n8n
npm install
```

---

## Environment Variables

| Variable | Default | Required | Description |
|---|---|:---:|---|
| `N8N_BASE_URL` | `http://localhost:5678` | No | Your n8n instance URL. Do **not** include `/mcp-server/http`. |
| `N8N_API_KEY` | — | **Yes** | API key from Settings > n8n API. |
| `N8N_MAX_RETRIES` | `3` | No | Max retry attempts on 429 (rate limit) and 5xx errors. |
| `N8N_TIMEOUT` | `30000` | No | Request timeout in milliseconds. |

---

## Configuration by Client

### Claude Code

```bash
claude mcp add --scope user \
  -e N8N_BASE_URL=http://localhost:5678 \
  -e N8N_API_KEY=your-api-key \
  -- n8n npx -y @nextoolsolutions/mcp-n8n
```

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@nextoolsolutions/mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@nextoolsolutions/mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

Config file location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Windsurf

Add to your Windsurf MCP config:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "@nextoolsolutions/mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code (Copilot)

Add to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "n8n": {
        "command": "npx",
        "args": ["-y", "@nextoolsolutions/mcp-n8n"],
        "env": {
          "N8N_BASE_URL": "http://localhost:5678",
          "N8N_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

---

## Getting your API Key

1. Open your n8n instance in the browser
2. Go to **Settings** (gear icon) > **n8n API**
3. Click **Create an API key** — set a name and optional expiration
4. Copy the key and set it as `N8N_API_KEY`

---

## Note on the n8n URL

The URL `http://localhost:5678/mcp-server/http` is the endpoint where **n8n itself** exposes its own built-in MCP. The `@nextoolsolutions/mcp-n8n` package is a **separate MCP server** that communicates with the **n8n REST API** at `/api/v1/`. That is why `N8N_BASE_URL` should be the base URL only (e.g., `http://localhost:5678`), without `/mcp-server/http`.

---

## Verifying the Connection

After configuring, the MCP log should show:

```
Successfully connected to stdio server
Found 43 tools
```

If the server does not appear or shows an error, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
