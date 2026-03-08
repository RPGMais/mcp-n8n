# Troubleshooting — mcp-n8n

Common issues encountered during setup and usage, and how to resolve them.

---

## 1. "N8N_API_KEY is not set"

**Cause:** The `N8N_API_KEY` environment variable was not provided or is empty.

**Solution:**

- Ensure the API key is set in your MCP configuration (see [SETUP.md](SETUP.md)).
- For Claude Code: check that the `-e N8N_API_KEY=...` flag was passed when registering.
- For Cursor/Claude Desktop: check the `env` block in your `mcp.json`.
- Restart the MCP server after changing environment variables.

---

## 2. "No server info found" / "Server not yet created"

**Causes:**

- No MCP server is configured in your client.
- The command or args point to a file that does not exist.

**Solution:**

- Follow the setup instructions in [SETUP.md](SETUP.md) for your specific client.
- If using npx, ensure `npx -y @nextoolsolutions/mcp-n8n` works from the command line.
- If using a local install, ensure `npm install` has been run and the entry point exists.

---

## 3. "fetch is not defined"

**Cause:** Node.js 16 does not have a global `fetch` (available from Node 18+). The n8n client uses `fetch()` to call the API.

**Solution:** The client in `src/n8n-client.ts` includes a fallback to native `http`/`https` modules when `globalThis.fetch` is not available. No extra dependencies are needed.

If the error persists, upgrade to **Node.js 18+** (recommended) or reconnect the MCP to reload the code.

---

## 4. "Output validation error: ... no structured content was provided"

**Cause:** The MCP SDK expects tools with `outputSchema` to return `structuredContent` in addition to `content` (text).

**Solution:** This was fixed in v2.0. The `jsonResult()` function returns both `content` and `structuredContent`. Ensure you are running the latest version:

```bash
npx -y @nextoolsolutions/mcp-n8n@latest
```

---

## 5. "Invalid structured content ... nextCursor: Expected string, received null"

**Cause:** The n8n API returns `nextCursor: null` when there is no next page. Earlier versions had a Zod schema with `z.string().optional()`, which accepts `undefined` but not `null`.

**Solution:** Fixed in v2.0. The schema now uses `z.string().nullable().optional()`. Update to the latest version.

---

## 6. "Tool not found: mcp_..._n8n_list_workflows"

**Causes:**

- The workspace open in your editor is not the one containing the MCP configuration.
- The MCP server failed to start (process crashed).
- The MCP server is disabled in your client settings.

**Solution:**

- Ensure the correct workspace is open.
- Check your client's MCP settings to verify the n8n server is active and shows no error icon.
- Check the MCP output/log channel for startup errors (e.g., Node not in PATH, wrong file path).

---

## 7. npm / npx: command not found

**Cause:** Node.js and npm are not installed in the environment where the MCP process runs.

**Solution:** Install Node.js 18+.

- **RHEL / AlmaLinux 9:** `sudo dnf module install nodejs:18`
- **Ubuntu / Debian:** `sudo apt install nodejs npm`
- **macOS:** `brew install node`
- **Any platform:** Use [nvm](https://github.com/nvm-sh/nvm) for version management.

---

## 8. Connection timeout / ECONNREFUSED

**Cause:** The n8n instance is not reachable at the configured `N8N_BASE_URL`.

**Solution:**

- Verify n8n is running: `curl http://localhost:5678/healthz`
- If n8n runs in Docker, ensure the port is exposed and accessible from the host.
- If using a remote URL, check network/firewall rules.
- Increase `N8N_TIMEOUT` if the instance is slow to respond.

---

## 9. 401 Unauthorized / 403 Forbidden

**Cause:** The API key is invalid, expired, or lacks the required permissions.

**Solution:**

- Generate a new API key in **Settings > n8n API** in your n8n instance.
- Ensure the key belongs to a user with sufficient permissions (owner role is required for user management and audit).
- Update the key in your MCP configuration and restart the server.

---

## Restarting the MCP after changes

If you modify the server code or update environment variables, the MCP process must be restarted to load the changes:

1. In your client's MCP settings, disable (or remove) the **n8n** server
2. Re-enable (or re-add) it
3. The log should show `Successfully connected to stdio server` and `Found 43 tools`

If using npx, you can also clear the npx cache to force a fresh download:

```bash
npx -y @nextoolsolutions/mcp-n8n@latest
```
