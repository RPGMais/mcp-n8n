#!/usr/bin/env node

/**
 * MCP Server for n8n — the most complete n8n MCP available.
 *
 * 43 tools covering: Workflows, Executions, Data Tables, Tags, Credentials,
 * Users, Variables, Projects, Audit, Webhooks and Health Check.
 *
 * Environment variables:
 *   N8N_BASE_URL    — n8n instance URL (default: http://localhost:5678)
 *   N8N_API_KEY     — API key from Settings → n8n API
 *   N8N_MAX_RETRIES — max retry attempts on 429/5xx (default: 3)
 *   N8N_TIMEOUT     — request timeout in ms (default: 30000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  type N8nConfig,
  // Workflows
  listWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow,
  activateWorkflow, deactivateWorkflow, executeWorkflow,
  getWorkflowTags, updateWorkflowTags,
  // Executions
  listExecutions, getExecution, deleteExecution,
  // Data Tables
  listDataTables, createDataTable, getDataTable, getDataTableRows,
  insertDataTableRows, updateDataTableRows, upsertDataTableRow, deleteDataTableRows,
  // Tags
  listTags, getTag, createTag, updateTag, deleteTag,
  // Credentials
  listCredentials, createCredential, deleteCredential, getCredentialSchema,
  // Users
  listUsers, getUser, deleteUser,
  // Variables
  listVariables, createVariable, deleteVariable,
  // Projects
  listProjects, createProject, updateProject, deleteProject,
  // Audit
  generateAudit,
  // System
  healthCheck,
  // Webhooks
  triggerWebhook,
} from "./n8n-client.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? "http://localhost:5678";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

const config: N8nConfig = {
  baseUrl: N8N_BASE_URL.replace(/\/mcp-server\/http\/?$/i, "").replace(/\/$/, ""),
  apiKey: N8N_API_KEY,
};

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

function toolResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

function jsonResult(obj: unknown) {
  const safe: Record<string, unknown> =
    typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : { value: obj };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(safe, null, 2) }],
    structuredContent: safe,
  };
}

function errorResult(msg: string) {
  return { ...jsonResult({ error: msg }), isError: true };
}

/** Wraps a handler — checks API key and catches errors. */
function wrap<A, R>(fn: (args: A) => Promise<R>) {
  return async (args: A) => {
    if (!config.apiKey) return toolResult("N8N_API_KEY is not set. Set the environment variable and restart.", true);
    try {
      return await fn(args);
    } catch (e) {
      return errorResult(e instanceof Error ? e.message : String(e));
    }
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "mcp-n8n",
  version: "2.0.0",
  description:
    "The most complete MCP server for n8n. Manage workflows, executions, " +
    "data tables, tags, credentials, users, variables, projects, audit and webhooks.",
});

// ===========================================================================
// WORKFLOWS (8 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_workflows",
  {
    title: "List workflows",
    description: "List all workflows. Optionally filter by active status and limit results.",
    inputSchema: z.object({
      active: z.boolean().optional().describe("Filter by active status"),
      limit: z.number().min(1).max(250).optional().describe("Max items to return (default 100)"),
    }),
    outputSchema: z.object({ data: z.array(z.unknown()), nextCursor: z.string().nullable().optional() }).passthrough(),
  },
  wrap(async ({ active, limit }) => jsonResult(await listWorkflows(config, { active, limit }))),
);

server.registerTool(
  "n8n_get_workflow",
  {
    title: "Get workflow",
    description: "Retrieve a workflow by ID, including nodes, connections and settings.",
    inputSchema: z.object({ workflowId: z.string().describe("Workflow ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId }) => jsonResult(await getWorkflow(config, workflowId))),
);

server.registerTool(
  "n8n_create_workflow",
  {
    title: "Create workflow",
    description: "Create a new workflow. Provide the workflow JSON (name, nodes, connections, settings).",
    inputSchema: z.object({
      workflow: z.record(z.unknown()).describe("Workflow object (name, nodes, connections, settings)"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflow }) => jsonResult(await createWorkflow(config, workflow as Record<string, unknown>) ?? {})),
);

server.registerTool(
  "n8n_update_workflow",
  {
    title: "Update workflow",
    description:
      "Update an existing workflow. Send the complete workflow object " +
      "(get it first with n8n_get_workflow).",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      workflow: z.record(z.unknown()).describe("Complete workflow object"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId, workflow }) =>
    jsonResult(await updateWorkflow(config, workflowId, workflow as Record<string, unknown>)),
  ),
);

server.registerTool(
  "n8n_delete_workflow",
  {
    title: "Delete workflow",
    description: "Permanently delete a workflow by ID.",
    inputSchema: z.object({ workflowId: z.string().describe("Workflow ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ workflowId }) => {
    await deleteWorkflow(config, workflowId);
    return jsonResult({ ok: true });
  }),
);

server.registerTool(
  "n8n_activate_workflow",
  {
    title: "Activate workflow",
    description: "Activate a workflow for production. Requires at least one trigger node.",
    inputSchema: z.object({ workflowId: z.string().describe("Workflow ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId }) => jsonResult(await activateWorkflow(config, workflowId) ?? { active: true })),
);

server.registerTool(
  "n8n_deactivate_workflow",
  {
    title: "Deactivate workflow",
    description: "Deactivate a workflow (stops listening for triggers).",
    inputSchema: z.object({ workflowId: z.string().describe("Workflow ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId }) => jsonResult(await deactivateWorkflow(config, workflowId) ?? { active: false })),
);

server.registerTool(
  "n8n_execute_workflow",
  {
    title: "Execute workflow",
    description: "Trigger a workflow execution. Optionally send input data.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      data: z.record(z.unknown()).optional().describe("Input data for the workflow"),
    }),
    outputSchema: z.object({ executionId: z.string(), status: z.string() }).passthrough(),
  },
  wrap(async ({ workflowId, data }) => {
    const result = await executeWorkflow(config, workflowId, data);
    const exec = result?.data;
    if (!exec) return toolResult(JSON.stringify(result), true);
    return jsonResult({ executionId: exec.id, status: exec.status, raw: exec });
  }),
);

// ===========================================================================
// WORKFLOW TAGS (2 tools)
// ===========================================================================

server.registerTool(
  "n8n_get_workflow_tags",
  {
    title: "Get workflow tags",
    description: "List all tags associated with a specific workflow.",
    inputSchema: z.object({ workflowId: z.string().describe("Workflow ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId }) => jsonResult(await getWorkflowTags(config, workflowId) ?? [])),
);

server.registerTool(
  "n8n_update_workflow_tags",
  {
    title: "Update workflow tags",
    description: "Replace all tags on a workflow. Send an array of tag IDs.",
    inputSchema: z.object({
      workflowId: z.string().describe("Workflow ID"),
      tagIds: z.array(z.object({ id: z.string() })).describe('Array of tag IDs, e.g. [{"id":"1"},{"id":"2"}]'),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ workflowId, tagIds }) => jsonResult(await updateWorkflowTags(config, workflowId, tagIds) ?? [])),
);

// ===========================================================================
// EXECUTIONS (3 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_executions",
  {
    title: "List executions",
    description: "List workflow executions. Filter by workflowId, status, limit and cursor.",
    inputSchema: z.object({
      workflowId: z.string().optional().describe("Filter by workflow ID"),
      limit: z.number().min(1).max(250).optional().describe("Max items (default 100)"),
      cursor: z.string().optional().describe("Pagination cursor from previous response"),
      status: z.enum(["running", "success", "error", "waiting"]).optional().describe("Filter by status"),
    }),
    outputSchema: z.object({ data: z.array(z.unknown()), nextCursor: z.string().nullable().optional() }),
  },
  wrap(async ({ workflowId, limit, cursor, status }) =>
    jsonResult(await listExecutions(config, { workflowId, limit, cursor, status })),
  ),
);

server.registerTool(
  "n8n_get_execution",
  {
    title: "Get execution",
    description: "Get the status and result data of a specific execution.",
    inputSchema: z.object({ executionId: z.string().describe("Execution ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ executionId }) => jsonResult(await getExecution(config, executionId))),
);

server.registerTool(
  "n8n_delete_execution",
  {
    title: "Delete execution",
    description: "Permanently delete an execution record by ID.",
    inputSchema: z.object({ executionId: z.string().describe("Execution ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ executionId }) => {
    await deleteExecution(config, executionId);
    return jsonResult({ ok: true });
  }),
);

// ===========================================================================
// DATA TABLES (8 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_datatables",
  {
    title: "List data tables",
    description: "List data tables with optional filtering, sorting and pagination.",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional(),
      cursor: z.string().optional(),
      filter: z.string().optional().describe('JSON filter, e.g. {"name":"my-table"}'),
      sortBy: z.string().optional().describe("e.g. name:asc"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit, cursor, filter, sortBy }) =>
    jsonResult(await listDataTables(config, { limit, cursor, filter, sortBy })),
  ),
);

server.registerTool(
  "n8n_create_datatable",
  {
    title: "Create data table",
    description: "Create a data table with typed columns (string, number, boolean, date, json).",
    inputSchema: z.object({
      name: z.string().describe("Table name"),
      columns: z.array(z.object({
        name: z.string(),
        type: z.enum(["string", "number", "boolean", "date", "json"]),
      })),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ name, columns }) => jsonResult(await createDataTable(config, { name, columns }) ?? {})),
);

server.registerTool(
  "n8n_get_datatable",
  {
    title: "Get data table",
    description: "Retrieve metadata (columns, name, ID) of a data table.",
    inputSchema: z.object({ dataTableId: z.string().describe("Data table ID (nanoid)") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ dataTableId }) => jsonResult(await getDataTable(config, dataTableId))),
);

server.registerTool(
  "n8n_get_datatable_rows",
  {
    title: "Query data table rows",
    description:
      "List rows from a data table with optional filter, search, sorting and pagination. " +
      "Filter is a JSON string with {type, filters} structure.",
    inputSchema: z.object({
      dataTableId: z.string().describe("Data table ID"),
      limit: z.number().min(1).max(250).optional().describe("Max rows (default 50)"),
      cursor: z.string().optional().describe("Pagination cursor"),
      filter: z.string().optional().describe('JSON filter, e.g. {"type":"and","filters":[{"columnName":"status","condition":"eq","value":"active"}]}'),
      sortBy: z.string().optional().describe("columnName:asc or columnName:desc"),
      search: z.string().optional().describe("Full-text search on string columns"),
    }),
    outputSchema: z.object({ data: z.array(z.unknown()), nextCursor: z.string().nullable().optional() }).passthrough(),
  },
  wrap(async ({ dataTableId, limit, cursor, filter, sortBy, search }) =>
    jsonResult(await getDataTableRows(config, dataTableId, { limit, cursor, filter, sortBy, search })),
  ),
);

server.registerTool(
  "n8n_insert_datatable_rows",
  {
    title: "Insert data table rows",
    description: "Insert one or more rows. Each row is an object with column names as keys.",
    inputSchema: z.object({
      dataTableId: z.string().describe("Data table ID"),
      data: z.array(z.record(z.unknown())).min(1).describe("Array of row objects"),
      returnType: z.enum(["count", "id", "all"]).optional().describe("count (default), id or all"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ dataTableId, data, returnType }) =>
    jsonResult(await insertDataTableRows(config, dataTableId, { data, returnType: returnType ?? "count" }) ?? {}),
  ),
);

const rowFilterSchema = z.object({
  type: z.enum(["and", "or"]).optional().describe("Combinator (default: and)"),
  filters: z.array(z.object({
    columnName: z.string(),
    condition: z.string().describe("eq, neq, like, ilike, gt, gte, lt, lte"),
    value: z.unknown(),
  })),
});

server.registerTool(
  "n8n_update_datatable_rows",
  {
    title: "Update data table rows",
    description: "Update rows matching a filter. Conditions: eq, neq, like, ilike, gt, gte, lt, lte.",
    inputSchema: z.object({
      dataTableId: z.string().describe("Data table ID"),
      filter: rowFilterSchema,
      data: z.record(z.unknown()).describe("Columns and values to set"),
      returnData: z.boolean().optional().describe("Return updated rows"),
      dryRun: z.boolean().optional().describe("Simulate only"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ dataTableId, filter, data, returnData, dryRun }) =>
    jsonResult(await updateDataTableRows(config, dataTableId, {
      filter: filter as { type?: "and" | "or"; filters: Array<{ columnName: string; condition: string; value: unknown }> },
      data, returnData, dryRun,
    }) ?? {}),
  ),
);

server.registerTool(
  "n8n_upsert_datatable_row",
  {
    title: "Upsert data table row",
    description: "Update a row if it exists (by filter) or insert a new one.",
    inputSchema: z.object({
      dataTableId: z.string().describe("Data table ID"),
      filter: rowFilterSchema,
      data: z.record(z.unknown()).describe("Columns and values"),
      returnData: z.boolean().optional(),
      dryRun: z.boolean().optional(),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ dataTableId, filter, data, returnData, dryRun }) =>
    jsonResult(await upsertDataTableRow(config, dataTableId, {
      filter: filter as { type?: "and" | "or"; filters: Array<{ columnName: string; condition: string; value: unknown }> },
      data, returnData, dryRun,
    }) ?? {}),
  ),
);

server.registerTool(
  "n8n_delete_datatable_rows",
  {
    title: "Delete data table rows",
    description: "Delete rows matching a filter. The filter is required (JSON string).",
    inputSchema: z.object({
      dataTableId: z.string().describe("Data table ID"),
      filter: z.string().describe('JSON filter, e.g. {"type":"and","filters":[{"columnName":"id","condition":"eq","value":123}]}'),
      returnData: z.boolean().optional().describe("Return deleted rows"),
      dryRun: z.boolean().optional().describe("Simulate only"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ dataTableId, filter, returnData, dryRun }) =>
    jsonResult(await deleteDataTableRows(config, dataTableId, { filter, returnData, dryRun }) ?? {}),
  ),
);

// ===========================================================================
// TAGS (5 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_tags",
  {
    title: "List tags",
    description: "List all tags in the n8n instance.",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional().describe("Max tags to return"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit }) => jsonResult(await listTags(config, { limit }) ?? [])),
);

server.registerTool(
  "n8n_get_tag",
  {
    title: "Get tag",
    description: "Retrieve a tag by ID.",
    inputSchema: z.object({ tagId: z.string().describe("Tag ID") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ tagId }) => jsonResult(await getTag(config, tagId))),
);

server.registerTool(
  "n8n_create_tag",
  {
    title: "Create tag",
    description: "Create a new tag with the given name.",
    inputSchema: z.object({ name: z.string().describe("Tag name") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ name }) => jsonResult(await createTag(config, name) ?? {})),
);

server.registerTool(
  "n8n_update_tag",
  {
    title: "Update tag",
    description: "Rename an existing tag.",
    inputSchema: z.object({
      tagId: z.string().describe("Tag ID"),
      name: z.string().describe("New tag name"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ tagId, name }) => jsonResult(await updateTag(config, tagId, name) ?? {})),
);

server.registerTool(
  "n8n_delete_tag",
  {
    title: "Delete tag",
    description: "Delete a tag by ID. This does not affect workflows that used this tag.",
    inputSchema: z.object({ tagId: z.string().describe("Tag ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ tagId }) => {
    await deleteTag(config, tagId);
    return jsonResult({ ok: true });
  }),
);

// ===========================================================================
// CREDENTIALS (4 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_credentials",
  {
    title: "List credentials",
    description: "List all credentials (names and types only — data is redacted).",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional(),
      cursor: z.string().optional(),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit, cursor }) => jsonResult(await listCredentials(config, { limit, cursor }))),
);

server.registerTool(
  "n8n_create_credential",
  {
    title: "Create credential",
    description:
      "Create a new credential. Use n8n_get_credential_schema to discover the required fields for a type.",
    inputSchema: z.object({
      name: z.string().describe("Display name"),
      type: z.string().describe("Credential type (e.g. slackApi, httpBasicAuth)"),
      data: z.record(z.unknown()).describe("Credential fields as key-value pairs"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ name, type, data }) => jsonResult(await createCredential(config, { name, type, data }) ?? {})),
);

server.registerTool(
  "n8n_delete_credential",
  {
    title: "Delete credential",
    description: "Permanently delete a credential by ID.",
    inputSchema: z.object({ credentialId: z.string().describe("Credential ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ credentialId }) => {
    await deleteCredential(config, credentialId);
    return jsonResult({ ok: true });
  }),
);

server.registerTool(
  "n8n_get_credential_schema",
  {
    title: "Get credential schema",
    description: "Get the JSON schema for a credential type, showing required and optional fields.",
    inputSchema: z.object({
      typeName: z.string().describe("Credential type name (e.g. slackApi)"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ typeName }) => jsonResult(await getCredentialSchema(config, typeName))),
);

// ===========================================================================
// USERS (3 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_users",
  {
    title: "List users",
    description: "List all users in the n8n instance (requires owner role).",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional(),
      cursor: z.string().optional(),
      includeRole: z.boolean().optional().describe("Include role information"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit, cursor, includeRole }) =>
    jsonResult(await listUsers(config, { limit, cursor, includeRole })),
  ),
);

server.registerTool(
  "n8n_get_user",
  {
    title: "Get user",
    description: "Retrieve a user by ID or email.",
    inputSchema: z.object({
      idOrEmail: z.string().describe("User ID or email address"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ idOrEmail }) => jsonResult(await getUser(config, idOrEmail))),
);

server.registerTool(
  "n8n_delete_user",
  {
    title: "Delete user",
    description: "Delete a user by ID (requires owner role). Workflows owned by this user must be transferred first.",
    inputSchema: z.object({ userId: z.string().describe("User ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ userId }) => {
    await deleteUser(config, userId);
    return jsonResult({ ok: true });
  }),
);

// ===========================================================================
// VARIABLES (3 tools)
// ===========================================================================

server.registerTool(
  "n8n_list_variables",
  {
    title: "List variables",
    description: "List all environment variables stored in n8n.",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional(),
      cursor: z.string().optional(),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit, cursor }) => jsonResult(await listVariables(config, { limit, cursor }))),
);

server.registerTool(
  "n8n_create_variable",
  {
    title: "Create variable",
    description: "Create a new environment variable in n8n (key-value pair).",
    inputSchema: z.object({
      key: z.string().describe("Variable key"),
      value: z.string().describe("Variable value"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ key, value }) => jsonResult(await createVariable(config, key, value) ?? {})),
);

server.registerTool(
  "n8n_delete_variable",
  {
    title: "Delete variable",
    description: "Delete an environment variable by ID.",
    inputSchema: z.object({ variableId: z.string().describe("Variable ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ variableId }) => {
    await deleteVariable(config, variableId);
    return jsonResult({ ok: true });
  }),
);

// ===========================================================================
// PROJECTS (4 tools — Enterprise)
// ===========================================================================

server.registerTool(
  "n8n_list_projects",
  {
    title: "List projects",
    description: "List all projects (Enterprise feature).",
    inputSchema: z.object({
      limit: z.number().min(1).max(250).optional(),
      cursor: z.string().optional(),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ limit, cursor }) => jsonResult(await listProjects(config, { limit, cursor }))),
);

server.registerTool(
  "n8n_create_project",
  {
    title: "Create project",
    description: "Create a new project (Enterprise feature).",
    inputSchema: z.object({ name: z.string().describe("Project name") }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ name }) => jsonResult(await createProject(config, name) ?? {})),
);

server.registerTool(
  "n8n_update_project",
  {
    title: "Update project",
    description: "Rename an existing project (Enterprise feature).",
    inputSchema: z.object({
      projectId: z.string().describe("Project ID"),
      name: z.string().describe("New project name"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ projectId, name }) => jsonResult(await updateProject(config, projectId, name) ?? {})),
);

server.registerTool(
  "n8n_delete_project",
  {
    title: "Delete project",
    description: "Delete a project by ID (Enterprise feature).",
    inputSchema: z.object({ projectId: z.string().describe("Project ID") }),
    outputSchema: z.object({ ok: z.boolean() }),
  },
  wrap(async ({ projectId }) => {
    await deleteProject(config, projectId);
    return jsonResult({ ok: true });
  }),
);

// ===========================================================================
// AUDIT (1 tool)
// ===========================================================================

server.registerTool(
  "n8n_generate_audit",
  {
    title: "Security audit",
    description:
      "Generate a security audit report for the n8n instance. " +
      "Categories: credentials, database, filesystem, instance, nodes.",
    inputSchema: z.object({
      categories: z
        .array(z.enum(["credentials", "database", "filesystem", "instance", "nodes"]))
        .optional()
        .describe("Audit categories (all if omitted)"),
      daysAbandonedWorkflow: z
        .number()
        .optional()
        .describe("Days to consider a workflow abandoned (default 90)"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ categories, daysAbandonedWorkflow }) =>
    jsonResult(await generateAudit(config, { categories, daysAbandonedWorkflow })),
  ),
);

// ===========================================================================
// SYSTEM (1 tool)
// ===========================================================================

server.registerTool(
  "n8n_health_check",
  {
    title: "Health check",
    description: "Check connectivity to the n8n instance and verify the API is reachable.",
    inputSchema: z.object({}),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async () => {
    const result = await healthCheck(config);
    return jsonResult({ status: "ok", ...result });
  }),
);

// ===========================================================================
// WEBHOOKS (1 tool)
// ===========================================================================

server.registerTool(
  "n8n_trigger_webhook",
  {
    title: "Trigger webhook",
    description:
      "Trigger a workflow via its webhook URL. Use isTest=true for test webhooks. " +
      "The webhookPath is the path configured in the Webhook node.",
    inputSchema: z.object({
      webhookPath: z.string().describe("Webhook path (as configured in the Webhook node)"),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional().describe("HTTP method (default POST)"),
      data: z.record(z.unknown()).optional().describe("Request body (JSON)"),
      headers: z.record(z.string()).optional().describe("Custom headers"),
      isTest: z.boolean().optional().describe("Use /webhook-test instead of /webhook"),
    }),
    outputSchema: z.object({}).passthrough(),
  },
  wrap(async ({ webhookPath, method, data, headers, isTest }) =>
    jsonResult(await triggerWebhook(config, webhookPath, { method, data, headers, isTest }) ?? {}),
  ),
);

// ===========================================================================
// Start server
// ===========================================================================

const transport = new StdioServerTransport();
try {
  await server.connect(transport);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[mcp-n8n] Failed to start: ${msg}\n`);
  process.exit(1);
}
