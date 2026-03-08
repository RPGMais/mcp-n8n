# mcp-n8n

The most complete MCP server for [n8n](https://n8n.io) — **43 tools** covering the entire n8n API.

Built with the [Model Context Protocol](https://modelcontextprotocol.io/) SDK for use with Claude, Cursor, Windsurf and any MCP-compatible AI assistant.

## Why this one?

| Feature | mcp-n8n | leonardsellem | illuminare | czlonkowski |
|---|:---:|:---:|:---:|:---:|
| Workflows (CRUD + execute) | **10** | 7 | 8 | 4 |
| Executions (list/get/delete) | **3** | 5 | 3 | 2 |
| **Data Tables (full CRUD)** | **8** | — | — | — |
| Tags (CRUD + workflow tags) | **7** | — | 5 | — |
| Credentials | **4** | — | 3 | — |
| Users | **3** | — | 4 | — |
| Variables | **3** | — | 3 | — |
| Projects (Enterprise) | **4** | — | 4 | — |
| Security Audit | **1** | — | 1 | — |
| Webhooks | **1** | 1 | — | 1 |
| Health Check | **1** | — | — | 1 |
| **Total** | **43** | **12** | **33** | **20** |

**Only MCP with Data Tables support** — full CRUD with filters, search, upsert and dry-run.

## Quick Start

### Claude Code

```bash
claude mcp add --scope user -e N8N_BASE_URL=http://localhost:5678 -e N8N_API_KEY=your-api-key -- mcp-n8n npx -y mcp-n8n
```

### Claude Desktop / Cursor / Windsurf

Add to your MCP config (e.g. `~/.cursor/mcp.json`):

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

### Getting your API key

1. Open your n8n instance
2. Go to **Settings → n8n API**
3. Create a new API key
4. Copy it into the `N8N_API_KEY` environment variable

## Tools

### Workflows (10)

| Tool | Description |
|---|---|
| `n8n_list_workflows` | List all workflows with optional filters |
| `n8n_get_workflow` | Get a workflow by ID |
| `n8n_create_workflow` | Create a new workflow |
| `n8n_update_workflow` | Update an existing workflow |
| `n8n_delete_workflow` | Delete a workflow |
| `n8n_activate_workflow` | Activate a workflow for production |
| `n8n_deactivate_workflow` | Deactivate a workflow |
| `n8n_execute_workflow` | Execute a workflow with optional input data |
| `n8n_get_workflow_tags` | List tags on a workflow |
| `n8n_update_workflow_tags` | Replace tags on a workflow |

### Executions (3)

| Tool | Description |
|---|---|
| `n8n_list_executions` | List executions with filters (workflow, status) |
| `n8n_get_execution` | Get execution details and results |
| `n8n_delete_execution` | Delete an execution record |

### Data Tables (8)

| Tool | Description |
|---|---|
| `n8n_list_datatables` | List data tables |
| `n8n_create_datatable` | Create a data table with typed columns |
| `n8n_get_datatable` | Get data table metadata |
| `n8n_get_datatable_rows` | Query rows with filter, search and pagination |
| `n8n_insert_datatable_rows` | Insert rows |
| `n8n_update_datatable_rows` | Update rows matching a filter |
| `n8n_upsert_datatable_row` | Update or insert a row |
| `n8n_delete_datatable_rows` | Delete rows matching a filter |

### Tags (5)

| Tool | Description |
|---|---|
| `n8n_list_tags` | List all tags |
| `n8n_get_tag` | Get a tag by ID |
| `n8n_create_tag` | Create a tag |
| `n8n_update_tag` | Rename a tag |
| `n8n_delete_tag` | Delete a tag |

### Credentials (4)

| Tool | Description |
|---|---|
| `n8n_list_credentials` | List credentials (names only, data redacted) |
| `n8n_create_credential` | Create a credential |
| `n8n_delete_credential` | Delete a credential |
| `n8n_get_credential_schema` | Get the JSON schema for a credential type |

### Users (3)

| Tool | Description |
|---|---|
| `n8n_list_users` | List all users (owner only) |
| `n8n_get_user` | Get a user by ID or email |
| `n8n_delete_user` | Delete a user |

### Variables (3)

| Tool | Description |
|---|---|
| `n8n_list_variables` | List environment variables |
| `n8n_create_variable` | Create a variable |
| `n8n_delete_variable` | Delete a variable |

### Projects — Enterprise (4)

| Tool | Description |
|---|---|
| `n8n_list_projects` | List projects |
| `n8n_create_project` | Create a project |
| `n8n_update_project` | Rename a project |
| `n8n_delete_project` | Delete a project |

### Audit (1)

| Tool | Description |
|---|---|
| `n8n_generate_audit` | Generate a security audit report |

### System (1)

| Tool | Description |
|---|---|
| `n8n_health_check` | Check n8n API connectivity |

### Webhooks (1)

| Tool | Description |
|---|---|
| `n8n_trigger_webhook` | Trigger a workflow via webhook URL |

## Configuration

| Variable | Default | Description |
|---|---|---|
| `N8N_BASE_URL` | `http://localhost:5678` | n8n instance URL |
| `N8N_API_KEY` | — | API key (required) |
| `N8N_MAX_RETRIES` | `3` | Max retry attempts on 429/5xx |
| `N8N_TIMEOUT` | `30000` | Request timeout in ms |

## Features

- **Automatic retry** with exponential backoff on 429 (rate limit) and 5xx errors
- **Configurable timeout** to prevent hung requests
- **Zero external dependencies** beyond MCP SDK and Zod
- **TypeScript strict mode** with full type safety
- **Node 16+ compatible** with native fetch fallback

## Development

```bash
git clone https://github.com/RPGMais/mcp-n8n.git
cd mcp-n8n
npm install
npm run dev    # Run with tsx (no build needed)
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## License

MIT
