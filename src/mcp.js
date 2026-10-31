// Minimal MCP server over JSON-RPC 2.0 (Streamable HTTP transport, JSON responses).
// Spec: https://modelcontextprotocol.io/specification

import { listTools } from "./registry.js";
import { execute } from "./executor.js";
import { CATALOG_TOOLS, searchOperations } from "./catalog.js";

export const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "web2mcp", title: "web2mcp gateway", version: "0.2.0-dev" };

const err = (id, code, message) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
const ok = (id, result) => ({ jsonrpc: "2.0", id, result });

/** Handle one JSON-RPC message. Returns a response object, or null for notifications. */
export async function handleRpc(msg, registry, env = {}, fetchImpl = fetch, opts = {}) {
  const catalog = !!opts.catalog;
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg?.id, -32600, "Invalid Request");
  }
  const isNotification = msg.id === undefined;
  const { id, method, params = {} } = msg;

  switch (method) {
    case "initialize": {
      const requested = params.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0];
      return ok(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: catalog
          ? "web2mcp exposes websites and REST APIs through two tools: use search_api to find an operation " +
            "and its arguments, then call_api to run it. Results are JSON trimmed to the useful fields."
          : "web2mcp exposes websites and REST APIs as tools. Tool names are <connector>_<tool>. " +
            "Results are JSON trimmed to the useful fields.",
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: catalog ? CATALOG_TOOLS : listTools(registry) });
    case "tools/call": {
      let name = params.name;
      let args = params.arguments || {};
      if (catalog) {
        if (name === "search_api") {
          const r = searchOperations(registry, args);
          return ok(id, { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], isError: false });
        }
        if (name !== "call_api") return err(id, -32602, `Unknown tool: ${name}`);
        name = args.operation;
        args = args.arguments || {};
        if (!registry.tools.has(name)) {
          return ok(id, {
            content: [{ type: "text", text: `Error: unknown operation "${name}". Use search_api to find valid operation names.` }],
            isError: true,
          });
        }
      }
      const entry = registry.tools.get(name);
      if (!entry) return err(id, -32602, `Unknown tool: ${name}`);
      try {
        const r = await execute(entry.connector, entry.tool, args, env, fetchImpl);
        return ok(id, { content: [{ type: "text", text: r.text }], isError: r.isError });
      } catch (e) {
        // Tool-level failures are reported in the result so the model can see and recover.
        return ok(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
      }
    }
    case "resources/list":
      return ok(id, { resources: [] });
    case "prompts/list":
      return ok(id, { prompts: [] });
    default:
      return isNotification ? null : err(id, -32601, `Method not found: ${method}`);
  }
}
