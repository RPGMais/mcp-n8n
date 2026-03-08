<div align="center">

# mcp-n8n

**The most complete MCP server for [n8n](https://n8n.io)**

43 tools · Workflows · Data Tables · Tags · Credentials · Users · Webhooks · Audit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-≥18-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.25-purple.svg)](https://modelcontextprotocol.io/)

[Quick Start](#-quick-start) · [All 43 Tools](#-tools) · [Configuration](#%EF%B8%8F-configuration) · [Contributing](#-contributing)

</div>

---

## Why mcp-n8n?

Other n8n MCPs cover workflows and executions. **mcp-n8n covers everything** — including Data Tables, the only MCP to do so.

| Feature | mcp-n8n | leonardsellem | illuminare | czlonkowski |
|---|:---:|:---:|:---:|:---:|
| Workflows (CRUD + execute) | **10** | 7 | 8 | 4 |
| Executions | **3** | 5 | 3 | 2 |
| **Data Tables** | **8** | — | — | — |
| Tags + Workflow Tags | **7** | — | 5 | — |
| Credentials | **4** | — | 3 | — |
| Users | **3** | — | 4 | — |
| Variables | **3** | — | 3 | — |
| Projects (Enterprise) | **4** | — | 4 | — |
| Security Audit | **1** | — | 1 | — |
| Webhooks | **1** | 1 | — | 1 |
| Health Check | **1** | — | — | 1 |
| **Total** | **43** | **12** | **33** | **20** |

> **Data Tables** — full CRUD with filters, search, upsert and dry-run. No other MCP has this.

---

## 🚀 Quick Start

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
claude mcp add --scope user \
  -e N8N_BASE_URL=http://localhost:5678 \
  -e N8N_API_KEY=your-api-key \
  -- mcp-n8n npx -y mcp-n8n
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to your Windsurf MCP config:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "mcp-n8n"],
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code (Copilot)</strong></summary>

Add to your VS Code `settings.json`:

```json
{
  "mcp": {
    "servers": {
      "n8n": {
        "command": "npx",
        "args": ["-y", "mcp-n8n"],
        "env": {
          "N8N_BASE_URL": "http://localhost:5678",
          "N8N_API_KEY": "your-api-key"
        }
      }
    }
  }
}
```

</details>

### Getting your API key

1. Open your n8n instance
2. Go to **Settings → n8n API**
3. Create a new API key
4. Copy it into the `N8N_API_KEY` environment variable

---

## 🛠 Tools

### Workflows (10)

| Tool | Description |
|---|---|
| `n8n_list_workflows` | List all workflows with optional filters |
| `n8n_get_workflow` | Get a workflow by ID (includes nodes, connections, settings) |
| `n8n_create_workflow` | Create a new workflow from JSON |
| `n8n_update_workflow` | Update an existing workflow (full replacement) |
| `n8n_delete_workflow` | Permanently delete a workflow |
| `n8n_activate_workflow` | Activate a workflow for production |
| `n8n_deactivate_workflow` | Deactivate a workflow |
| `n8n_execute_workflow` | Trigger execution with optional input data |
| `n8n_get_workflow_tags` | List tags associated with a workflow |
| `n8n_update_workflow_tags` | Replace all tags on a workflow |

### Executions (3)

| Tool | Description |
|---|---|
| `n8n_list_executions` | List executions with filters (workflow, status, cursor) |
| `n8n_get_execution` | Get execution status, result data and timing |
| `n8n_delete_execution` | Delete an execution record |

### Data Tables (8)

> Only available in n8n v1.64+. This is the **only MCP server with Data Tables support**.

| Tool | Description |
|---|---|
| `n8n_list_datatables` | List all data tables with filtering and sorting |
| `n8n_create_datatable` | Create a table with typed columns (string, number, boolean, date, json) |
| `n8n_get_datatable` | Get table metadata (columns, name, ID) |
| `n8n_get_datatable_rows` | Query rows with filter, full-text search, sorting and pagination |
| `n8n_insert_datatable_rows` | Insert one or more rows |
| `n8n_update_datatable_rows` | Update rows matching a filter (supports dry-run) |
| `n8n_upsert_datatable_row` | Update if exists, insert if not |
| `n8n_delete_datatable_rows` | Delete rows matching a filter (supports dry-run) |

### Tags (5)

| Tool | Description |
|---|---|
| `n8n_list_tags` | List all tags |
| `n8n_get_tag` | Get a tag by ID |
| `n8n_create_tag` | Create a new tag |
| `n8n_update_tag` | Rename a tag |
| `n8n_delete_tag` | Delete a tag |

### Credentials (4)

| Tool | Description |
|---|---|
| `n8n_list_credentials` | List credentials (names and types only — data is redacted) |
| `n8n_create_credential` | Create a credential (use `get_credential_schema` first) |
| `n8n_delete_credential` | Delete a credential |
| `n8n_get_credential_schema` | Get the JSON schema for a credential type |

### Users (3)

| Tool | Description |
|---|---|
| `n8n_list_users` | List all users (requires instance owner role) |
| `n8n_get_user` | Get a user by ID or email |
| `n8n_delete_user` | Delete a user |

### Variables (3)

| Tool | Description |
|---|---|
| `n8n_list_variables` | List all environment variables |
| `n8n_create_variable` | Create a key-value variable |
| `n8n_delete_variable` | Delete a variable |

### Projects (4) — Enterprise

| Tool | Description |
|---|---|
| `n8n_list_projects` | List all projects |
| `n8n_create_project` | Create a project |
| `n8n_update_project` | Rename a project |
| `n8n_delete_project` | Delete a project |

### Audit (1)

| Tool | Description |
|---|---|
| `n8n_generate_audit` | Generate a security audit (credentials, database, filesystem, nodes) |

### System (1)

| Tool | Description |
|---|---|
| `n8n_health_check` | Verify n8n API connectivity |

### Webhooks (1)

| Tool | Description |
|---|---|
| `n8n_trigger_webhook` | Trigger a workflow via its webhook URL (production or test) |

---

## ⚙️ Configuration

| Variable | Default | Description |
|---|---|---|
| `N8N_BASE_URL` | `http://localhost:5678` | Your n8n instance URL |
| `N8N_API_KEY` | — | API key (**required**) |
| `N8N_MAX_RETRIES` | `3` | Retry attempts on 429 / 5xx errors |
| `N8N_TIMEOUT` | `30000` | Request timeout in milliseconds |

---

## ✨ Features

- **43 tools** — the most comprehensive n8n MCP available
- **Data Tables** — full CRUD, the only MCP with this support
- **Automatic retry** — exponential backoff on rate limits (429) and server errors (5xx)
- **Configurable timeout** — prevent hung requests (default 30s)
- **Zero external dependencies** — only MCP SDK + Zod
- **TypeScript strict mode** — fully typed, safe, and maintainable
- **Node 16+ compatible** — native fetch with http/https fallback

---

## 🔒 Security

- API keys are **never hardcoded** — loaded exclusively from environment variables
- Credential data is **redacted** in list responses (n8n API behavior)
- All IDs are sanitized with `encodeURIComponent` to prevent path traversal
- No sensitive data is logged or exposed in error messages

---

## 🏗 Development

```bash
git clone https://github.com/RPGMais/mcp-n8n.git
cd mcp-n8n
npm install
```

| Command | Description |
|---|---|
| `npm run dev` | Run with tsx (no build step) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled version |

### Project structure

```
mcp-n8n/
├── src/
│   ├── index.ts          # MCP server — tool registration and handlers
│   └── n8n-client.ts     # HTTP client — API calls, retry, timeout
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

[MIT](LICENSE) — free for personal and commercial use.

---

<div align="center">

Built by [NexTool Solutions](https://github.com/RPGMais)

If this project helps you, consider giving it a ⭐

</div>
