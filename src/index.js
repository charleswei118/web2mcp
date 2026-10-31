// Cloudflare Worker entry: an MCP gateway that turns websites/APIs into tools.
//   POST /mcp      MCP Streamable HTTP endpoint (JSON-RPC 2.0)
//   GET  /         Human-readable index of connectors and tools
//   GET  /tools    JSON list of tools (handy for debugging)
//   GET  /health   Liveness check

import { buildRegistry, listTools } from "./registry.js";
import { handleRpc, SERVER_INFO } from "./mcp.js";
import { CATALOG_TOOLS, catalogMode } from "./catalog.js";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, mcp-session-id, mcp-protocol-version",
  "access-control-expose-headers": "mcp-session-id",
};

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra },
  });

/** Constant-time-ish string compare to avoid leaking the token through timing. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function authorized(request, env) {
  if (!env.AUTH_TOKEN) return true; // open mode (fine for public, read-only connectors)
  const h = request.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : new URL(request.url).searchParams.get("key") || "";
  return safeEqual(token, env.AUTH_TOKEN);
}

function indexPage(registry) {
  const rows = listTools(registry)
    .map((t) => `<tr><td><code>${t.name}</code></td><td>${escapeHtml(t.description)}</td></tr>`)
    .join("");
  return `<!doctype html><meta charset="utf-8"><title>web2mcp</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:860px;margin:40px auto;padding:0 16px}td{padding:6px 10px;border-bottom:1px solid #eee;vertical-align:top}code{background:#f4f4f4;padding:2px 4px;border-radius:4px}</style>
<h1>web2mcp <small>v${SERVER_INFO.version}</small></h1>
<p>MCP endpoint: <code>/mcp</code> (Streamable HTTP, one tool per operation) or <code>/mcp?mode=catalog</code> (two tools: <code>search_api</code> + <code>call_api</code>). ${registry.connectors.length} connectors, ${registry.tools.size} tools.</p>
<table>${rows}</table>
<p><a href="https://github.com/charleswei118/web2mcp">github.com/charleswei118/web2mcp</a></p>`;
}

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    let registry;
    try {
      registry = buildRegistry(env);
    } catch (e) {
      return json({ error: `Configuration error: ${e.message}` }, 500);
    }

    if (url.pathname === "/health") return json({ ok: true, ...SERVER_INFO });
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(indexPage(registry), { headers: { "content-type": "text/html; charset=utf-8", ...CORS } });
    }

    if (url.pathname === "/tools" || url.pathname === "/mcp") {
      if (!authorized(request, env)) return json({ error: "Unauthorized" }, 401, { "www-authenticate": "Bearer" });
    }
    if (url.pathname === "/tools") return json({ tools: catalogMode(env, url) ? CATALOG_TOOLS : listTools(registry) });

    if (url.pathname === "/mcp") {
      if (request.method === "GET") {
        // No server-initiated stream in this stateless server.
        return json({ error: "Use POST for MCP requests" }, 405, { allow: "POST" });
      }
      if (request.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
      }
      const batch = Array.isArray(payload);
      const msgs = batch ? payload : [payload];
      const results = (await Promise.all(msgs.map((m) => handleRpc(m, registry, env, fetch, { catalog: catalogMode(env, url) })))).filter(Boolean);
      if (!results.length) return new Response(null, { status: 202, headers: CORS });
      return json(batch ? results : results[0]);
    }

    return json({ error: "Not found" }, 404);
  },
};
