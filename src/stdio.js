// stdio transport: newline-delimited JSON-RPC over stdin/stdout.
// Lets web2mcp run as a local MCP server (Claude Desktop, Cursor, Glama, Docker)
// with the same connectors and tools as the Cloudflare Worker.

import { buildRegistry } from "./registry.js";
import { handleRpc } from "./mcp.js";
import { catalogMode } from "./catalog.js";

/** Pick the env keys web2mcp understands from a process-style env object. */
export function envFromProcess(penv = {}) {
  const keys = ["ENABLED_CONNECTORS", "CONNECTORS_JSON", "MAX_OUTPUT_CHARS", "TOOL_MODE"];
  const env = {};
  for (const k of keys) if (penv[k] !== undefined && penv[k] !== "") env[k] = penv[k];
  // Connector secrets (e.g. GITHUB_TOKEN) are referenced as {{env.NAME}} in templates.
  for (const [k, v] of Object.entries(penv)) if (/_(TOKEN|KEY|SECRET)$/.test(k) && !(k in env)) env[k] = v;
  return env;
}

/** Process one line of input; returns the serialized response line, or null. */
export async function handleLine(line, registry, env, fetchImpl = fetch) {
  const text = line.trim();
  if (!text) return null;
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const catalog = catalogMode(env);
  const batch = Array.isArray(payload);
  const msgs = batch ? payload : [payload];
  const results = (await Promise.all(msgs.map((m) => handleRpc(m, registry, env, fetchImpl, { catalog })))).filter(Boolean);
  if (!results.length) return null;
  return JSON.stringify(batch ? results : results[0]);
}

/** Run the stdio server until stdin closes. Logs go to stderr; stdout carries only JSON-RPC. */
export async function runStdio({ input = process.stdin, output = process.stdout, env = envFromProcess(process.env) } = {}) {
  const registry = buildRegistry(env);
  input.setEncoding("utf8");
  let buf = "";
  const write = (s) => s && output.write(s + "\n");
  input.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      // Handle requests concurrently but write each response as soon as it is ready.
      handleLine(line, registry, env).then(write, (e) => process.stderr.write(`web2mcp: ${e.message}\n`));
    }
  });
  await new Promise((resolve) => input.on("end", resolve));
  if (buf.trim()) write(await handleLine(buf, registry, env));
}
