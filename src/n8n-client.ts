/**
 * HTTP client for the n8n REST API (v1).
 *
 * Features:
 *   - Automatic retry with exponential backoff (429 / 5xx)
 *   - Configurable timeout (default 30 s)
 *   - Node 16 fallback when globalThis.fetch is unavailable
 *
 * Environment tunables:
 *   N8N_MAX_RETRIES  — max retry attempts (default 3)
 *   N8N_TIMEOUT      — request timeout in ms  (default 30000)
 */

import http from "node:http";
import https from "node:https";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API = "/api/v1";
const MAX_RETRIES = Math.max(0, parseInt(process.env.N8N_MAX_RETRIES ?? "3", 10));
const TIMEOUT_MS = Math.max(1000, parseInt(process.env.N8N_TIMEOUT ?? "30000", 10));
const BACKOFF_BASE = 1_000; // 1 s

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type N8nConfig = { baseUrl: string; apiKey: string };

export class N8nApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
  ) {
    super(message);
    this.name = "N8nApiError";
  }
}

export type CreateDataTableRequest = {
  name: string;
  columns: Array<{ name: string; type: "string" | "number" | "boolean" | "date" | "json" }>;
};

export type DataTableRowFilter = {
  type?: "and" | "or";
  filters: Array<{ columnName: string; condition: string; value: unknown }>;
};

export type UpdateRowsRequest = {
  filter: DataTableRowFilter;
  data: Record<string, unknown>;
  returnData?: boolean;
  dryRun?: boolean;
};

export type UpsertRowRequest = UpdateRowsRequest;

export type InsertRowsRequest = {
  data: Record<string, unknown>[];
  returnType?: "count" | "id" | "all";
};

export type DeleteRowsParams = {
  filter: string; // JSON string
  returnData?: boolean;
  dryRun?: boolean;
};

// ---------------------------------------------------------------------------
// HTTP primitives
// ---------------------------------------------------------------------------

/** Minimal Response-like interface covering both native fetch and our polyfill. */
interface SimpleResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
}

/** Node 16 polyfill using http/https modules. */
function nodeFetch(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<SimpleResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method ?? "GET",
        headers: opts.headers,
        timeout: TIMEOUT_MS,
      },
      (res: http.IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            text: () => Promise.resolve(Buffer.concat(chunks).toString("utf8")),
          }),
        );
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after ${TIMEOUT_MS}ms`));
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

const fetchFn: (
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<SimpleResponse> =
  typeof globalThis.fetch === "function"
    ? async (url, opts) => {
        const r = await globalThis.fetch(url, opts as RequestInit);
        return { ok: r.ok, status: r.status, statusText: r.statusText, text: () => r.text() };
      }
    : (url, opts) => nodeFetch(url, opts);

// ---------------------------------------------------------------------------
// Core request helpers
// ---------------------------------------------------------------------------

function trimSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Core API request with retry + timeout.
 * When `raw` is true the path is used as-is (no /api/v1 prefix) — useful for
 * webhooks, healthz, etc.
 */
export async function n8nRequest<T = unknown>(
  config: N8nConfig,
  method: string,
  path: string,
  body?: unknown,
  opts?: { raw?: boolean; extraHeaders?: Record<string, string> },
): Promise<T> {
  const prefix = opts?.raw ? "" : API;
  const url =
    trimSlash(config.baseUrl) + prefix + (path.startsWith("/") ? path : `/${path}`);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-N8N-API-KEY": config.apiKey,
    ...opts?.extraHeaders,
  };
  if (body != null) headers["Content-Type"] = "application/json";

  const init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  } = {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Timeout via AbortController when available (Node 18+)
      let controller: AbortController | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      if (typeof AbortController !== "undefined") {
        controller = new AbortController();
        timer = setTimeout(() => controller!.abort(), TIMEOUT_MS);
        init.signal = controller.signal;
      }

      const res = await fetchFn(url, init);
      if (timer) clearTimeout(timer);

      const text = await res.text();

      if (!res.ok) {
        const err = new N8nApiError(
          `n8n API ${method} ${path}: ${res.status} ${res.statusText}${text ? ` – ${text}` : ""}`,
          res.status,
          method,
          path,
        );
        if (attempt < MAX_RETRIES && isRetryable(res.status)) {
          lastError = err;
          await sleep(BACKOFF_BASE * 2 ** attempt);
          continue;
        }
        throw err;
      }

      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (e) {
      if (e instanceof N8nApiError) throw e;
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES) {
        await sleep(BACKOFF_BASE * 2 ** attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error("n8n request failed");
}

// ---------------------------------------------------------------------------
// Helpers for query-string building
// ---------------------------------------------------------------------------

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  return q.toString();
}

function withQs(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const q = qs(params);
  return q ? `${path}?${q}` : path;
}

function id(v: string): string {
  return encodeURIComponent(v);
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export function listWorkflows(cfg: N8nConfig, p?: { active?: boolean; limit?: number }) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/workflows", { active: p?.active, limit: p?.limit }),
  );
}

export function getWorkflow(cfg: N8nConfig, wfId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", `/workflows/${id(wfId)}`);
}

export function createWorkflow(cfg: N8nConfig, payload: Record<string, unknown>) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/workflows", payload);
}

export function updateWorkflow(cfg: N8nConfig, wfId: string, payload: Record<string, unknown>) {
  return n8nRequest<Record<string, unknown>>(cfg, "PUT", `/workflows/${id(wfId)}`, payload);
}

export function deleteWorkflow(cfg: N8nConfig, wfId: string) {
  return n8nRequest(cfg, "DELETE", `/workflows/${id(wfId)}`);
}

export function activateWorkflow(cfg: N8nConfig, wfId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", `/workflows/${id(wfId)}/activate`);
}

export function deactivateWorkflow(cfg: N8nConfig, wfId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", `/workflows/${id(wfId)}/deactivate`);
}

export function executeWorkflow(cfg: N8nConfig, wfId: string, data?: Record<string, unknown>) {
  return n8nRequest<{ data: { id: string; status: string; [k: string]: unknown } }>(
    cfg, "POST", "/executions", { workflowId: wfId, data: data ?? {} },
  );
}

// ---------------------------------------------------------------------------
// Workflow Tags
// ---------------------------------------------------------------------------

export function getWorkflowTags(cfg: N8nConfig, wfId: string) {
  return n8nRequest<unknown[]>(cfg, "GET", `/workflows/${id(wfId)}/tags`);
}

export function updateWorkflowTags(cfg: N8nConfig, wfId: string, tagIds: Array<{ id: string }>) {
  return n8nRequest<unknown[]>(cfg, "PUT", `/workflows/${id(wfId)}/tags`, tagIds);
}

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

export function listExecutions(
  cfg: N8nConfig,
  p?: { workflowId?: string; limit?: number; cursor?: string; status?: string },
) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/executions", {
      workflowId: p?.workflowId,
      limit: p?.limit !== undefined ? Math.min(250, Math.max(1, p.limit)) : undefined,
      cursor: p?.cursor,
      status: p?.status,
    }),
  );
}

export function getExecution(cfg: N8nConfig, execId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", `/executions/${id(execId)}`);
}

export function deleteExecution(cfg: N8nConfig, execId: string) {
  return n8nRequest(cfg, "DELETE", `/executions/${id(execId)}`);
}

// ---------------------------------------------------------------------------
// Data Tables
// ---------------------------------------------------------------------------

export function listDataTables(
  cfg: N8nConfig,
  p?: { limit?: number; cursor?: string; filter?: string; sortBy?: string },
) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/data-tables", {
      limit: p?.limit, cursor: p?.cursor, filter: p?.filter, sortBy: p?.sortBy,
    }),
  );
}

export function createDataTable(cfg: N8nConfig, body: CreateDataTableRequest) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/data-tables", body);
}

export function getDataTable(cfg: N8nConfig, dtId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", `/data-tables/${id(dtId)}`);
}

export function getDataTableRows(
  cfg: N8nConfig,
  dtId: string,
  p?: { limit?: number; cursor?: string; filter?: string; sortBy?: string; search?: string },
) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs(`/data-tables/${id(dtId)}/rows`, {
      limit: p?.limit !== undefined ? Math.min(250, Math.max(1, p.limit)) : undefined,
      cursor: p?.cursor,
      filter: p?.filter,
      sortBy: p?.sortBy,
      search: p?.search,
    }),
  );
}

export function insertDataTableRows(cfg: N8nConfig, dtId: string, body: InsertRowsRequest) {
  return n8nRequest<number | number[] | unknown[]>(
    cfg, "POST", `/data-tables/${id(dtId)}/rows`, body,
  );
}

export function updateDataTableRows(cfg: N8nConfig, dtId: string, body: UpdateRowsRequest) {
  return n8nRequest<boolean | unknown[]>(
    cfg, "PATCH", `/data-tables/${id(dtId)}/rows/update`, body,
  );
}

export function upsertDataTableRow(cfg: N8nConfig, dtId: string, body: UpsertRowRequest) {
  return n8nRequest<boolean | unknown>(
    cfg, "POST", `/data-tables/${id(dtId)}/rows/upsert`, body,
  );
}

export function deleteDataTableRows(cfg: N8nConfig, dtId: string, p: DeleteRowsParams) {
  return n8nRequest<boolean | unknown[]>(
    cfg, "DELETE", withQs(`/data-tables/${id(dtId)}/rows/delete`, {
      filter: p.filter, returnData: p.returnData, dryRun: p.dryRun,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function listTags(cfg: N8nConfig, p?: { limit?: number }) {
  return n8nRequest<unknown[]>(cfg, "GET", withQs("/tags", { limit: p?.limit }));
}

export function getTag(cfg: N8nConfig, tagId: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", `/tags/${id(tagId)}`);
}

export function createTag(cfg: N8nConfig, name: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/tags", { name });
}

export function updateTag(cfg: N8nConfig, tagId: string, name: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "PUT", `/tags/${id(tagId)}`, { name });
}

export function deleteTag(cfg: N8nConfig, tagId: string) {
  return n8nRequest(cfg, "DELETE", `/tags/${id(tagId)}`);
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export function listCredentials(cfg: N8nConfig, p?: { limit?: number; cursor?: string }) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/credentials", { limit: p?.limit, cursor: p?.cursor }),
  );
}

export function createCredential(
  cfg: N8nConfig,
  body: { name: string; type: string; data: Record<string, unknown> },
) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/credentials", body);
}

export function deleteCredential(cfg: N8nConfig, credId: string) {
  return n8nRequest(cfg, "DELETE", `/credentials/${id(credId)}`);
}

export function getCredentialSchema(cfg: N8nConfig, typeName: string) {
  return n8nRequest<Record<string, unknown>>(
    cfg, "GET", `/credentials/schema/${id(typeName)}`,
  );
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function listUsers(cfg: N8nConfig, p?: { limit?: number; cursor?: string; includeRole?: boolean }) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/users", { limit: p?.limit, cursor: p?.cursor, includeRole: p?.includeRole }),
  );
}

export function getUser(cfg: N8nConfig, idOrEmail: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", `/users/${id(idOrEmail)}`);
}

export function deleteUser(cfg: N8nConfig, userId: string) {
  return n8nRequest(cfg, "DELETE", `/users/${id(userId)}`);
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

export function listVariables(cfg: N8nConfig, p?: { limit?: number; cursor?: string }) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/variables", { limit: p?.limit, cursor: p?.cursor }),
  );
}

export function createVariable(cfg: N8nConfig, key: string, value: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/variables", { key, value });
}

export function deleteVariable(cfg: N8nConfig, varId: string) {
  return n8nRequest(cfg, "DELETE", `/variables/${id(varId)}`);
}

// ---------------------------------------------------------------------------
// Projects (Enterprise)
// ---------------------------------------------------------------------------

export function listProjects(cfg: N8nConfig, p?: { limit?: number; cursor?: string }) {
  return n8nRequest<{ data: unknown[]; nextCursor?: string }>(
    cfg, "GET", withQs("/projects", { limit: p?.limit, cursor: p?.cursor }),
  );
}

export function createProject(cfg: N8nConfig, name: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/projects", { name });
}

export function updateProject(cfg: N8nConfig, projectId: string, name: string) {
  return n8nRequest<Record<string, unknown>>(cfg, "PUT", `/projects/${id(projectId)}`, { name });
}

export function deleteProject(cfg: N8nConfig, projectId: string) {
  return n8nRequest(cfg, "DELETE", `/projects/${id(projectId)}`);
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export function generateAudit(
  cfg: N8nConfig,
  p?: { categories?: string[]; daysAbandonedWorkflow?: number },
) {
  return n8nRequest<Record<string, unknown>>(cfg, "POST", "/audit", {
    ...(p?.categories ? { additionalOptions: { categories: p.categories } } : {}),
    ...(p?.daysAbandonedWorkflow !== undefined
      ? { additionalOptions: { daysAbandonedWorkflow: p.daysAbandonedWorkflow } }
      : {}),
  });
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export function healthCheck(cfg: N8nConfig) {
  return n8nRequest<Record<string, unknown>>(cfg, "GET", "/healthz", undefined, { raw: true });
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export function triggerWebhook(
  cfg: N8nConfig,
  webhookPath: string,
  p?: { method?: string; data?: unknown; headers?: Record<string, string>; isTest?: boolean },
) {
  const prefix = p?.isTest ? "/webhook-test" : "/webhook";
  const path = prefix + (webhookPath.startsWith("/") ? webhookPath : `/${webhookPath}`);
  return n8nRequest<unknown>(
    cfg,
    p?.method ?? "POST",
    path,
    p?.data,
    { raw: true, extraHeaders: p?.headers },
  );
}
