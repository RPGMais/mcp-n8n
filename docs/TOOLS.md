# Tools — mcp-n8n v2.0

The MCP server exposes **43 tools** organized across 11 categories. All tools communicate with the n8n REST API (v1).

---

## Workflows (10)

| Tool | Description |
|---|---|
| `n8n_list_workflows` | List all workflows. Optionally filter by active status and limit results. |
| `n8n_get_workflow` | Retrieve a workflow by ID, including nodes, connections and settings. |
| `n8n_create_workflow` | Create a new workflow from a JSON object (name, nodes, connections, settings). |
| `n8n_update_workflow` | Update an existing workflow. Requires the complete workflow object (get it first with `n8n_get_workflow`). |
| `n8n_delete_workflow` | Permanently delete a workflow by ID. |
| `n8n_activate_workflow` | Activate a workflow for production. Requires at least one trigger node. |
| `n8n_deactivate_workflow` | Deactivate a workflow (stops listening for triggers). |
| `n8n_execute_workflow` | Trigger a workflow execution. Optionally send input data. |
| `n8n_get_workflow_tags` | List all tags associated with a specific workflow. |
| `n8n_update_workflow_tags` | Replace all tags on a workflow. Send an array of tag IDs. |

## Executions (3)

| Tool | Description |
|---|---|
| `n8n_list_executions` | List workflow executions. Filter by workflowId, status, limit and cursor. |
| `n8n_get_execution` | Get the status and result data of a specific execution. |
| `n8n_delete_execution` | Permanently delete an execution record by ID. |

## Data Tables (8)

> Only available in n8n v1.64+. This is the **only MCP server with Data Tables support**.

| Tool | Description |
|---|---|
| `n8n_list_datatables` | List data tables with optional filtering, sorting and pagination. |
| `n8n_create_datatable` | Create a data table with typed columns (string, number, boolean, date, json). |
| `n8n_get_datatable` | Retrieve metadata (columns, name, ID) of a data table. |
| `n8n_get_datatable_rows` | Query rows with filter, full-text search, sorting and pagination. |
| `n8n_insert_datatable_rows` | Insert one or more rows. Each row is an object with column names as keys. |
| `n8n_update_datatable_rows` | Update rows matching a filter. Conditions: eq, neq, like, ilike, gt, gte, lt, lte. Supports dry-run. |
| `n8n_upsert_datatable_row` | Update a row if it exists (by filter) or insert a new one. |
| `n8n_delete_datatable_rows` | Delete rows matching a filter. The filter is required (JSON string). Supports dry-run. |

## Tags (5)

| Tool | Description |
|---|---|
| `n8n_list_tags` | List all tags in the n8n instance. |
| `n8n_get_tag` | Retrieve a tag by ID. |
| `n8n_create_tag` | Create a new tag with the given name. |
| `n8n_update_tag` | Rename an existing tag. |
| `n8n_delete_tag` | Delete a tag by ID. Does not affect workflows that used this tag. |

## Credentials (4)

| Tool | Description |
|---|---|
| `n8n_list_credentials` | List all credentials (names and types only — data is redacted). |
| `n8n_create_credential` | Create a new credential. Use `n8n_get_credential_schema` to discover required fields for a type. |
| `n8n_delete_credential` | Permanently delete a credential by ID. |
| `n8n_get_credential_schema` | Get the JSON schema for a credential type, showing required and optional fields. |

## Users (3)

| Tool | Description |
|---|---|
| `n8n_list_users` | List all users in the n8n instance (requires owner role). |
| `n8n_get_user` | Retrieve a user by ID or email. |
| `n8n_delete_user` | Delete a user by ID (requires owner role). Workflows owned by this user must be transferred first. |

## Variables (3)

| Tool | Description |
|---|---|
| `n8n_list_variables` | List all environment variables stored in n8n. |
| `n8n_create_variable` | Create a new environment variable (key-value pair). |
| `n8n_delete_variable` | Delete an environment variable by ID. |

## Projects (4) — Enterprise

| Tool | Description |
|---|---|
| `n8n_list_projects` | List all projects (Enterprise feature). |
| `n8n_create_project` | Create a new project (Enterprise feature). |
| `n8n_update_project` | Rename an existing project (Enterprise feature). |
| `n8n_delete_project` | Delete a project by ID (Enterprise feature). |

## Audit (1)

| Tool | Description |
|---|---|
| `n8n_generate_audit` | Generate a security audit report. Categories: credentials, database, filesystem, instance, nodes. |

## System (1)

| Tool | Description |
|---|---|
| `n8n_health_check` | Check connectivity to the n8n instance and verify the API is reachable. |

## Webhooks (1)

| Tool | Description |
|---|---|
| `n8n_trigger_webhook` | Trigger a workflow via its webhook URL. Supports production and test webhooks, custom HTTP methods, body and headers. |

---

## API Correspondence

All tools call the n8n REST API (v1) under `/api/v1/`. Data Tables use the `/api/v1/data-tables/` endpoints (available since n8n v1.64). Webhook triggers call `/webhook/` or `/webhook-test/` directly.

The AI agent selects the appropriate tool based on your request — you do not need to reference tool names explicitly.
