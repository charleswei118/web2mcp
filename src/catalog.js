// Catalog mode: instead of exposing every endpoint as its own tool, expose two
// tools - one to discover endpoints, one to call them. Context cost stays flat
// no matter how many connectors/endpoints are loaded.

import { listTools } from "./registry.js";

export const CATALOG_TOOLS = [
  {
    name: "search_api",
    title: "Search available API operations",
    description:
      "Find API operations this gateway can call. Search by keywords (e.g. 'weather forecast', 'github repo'). " +
      "Returns operation names, descriptions and their argument schemas. Call this before call_api.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords describing what you need. Empty lists everything." },
        connector: { type: "string", description: "Optional: only search inside this connector." },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 8 },
      },
      required: [],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "call_api",
    title: "Call an API operation",
    description:
      "Execute one operation found with search_api. Pass its exact name and an arguments object matching its schema.",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "Operation name returned by search_api, e.g. weather_forecast." },
        arguments: { type: "object", description: "Arguments for the operation.", additionalProperties: true },
      },
      required: ["operation"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
];

const tokenize = (s) =>
  String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((w) => w.length > 1);

/** Compact view of an operation's arguments for the model. */
function compactArgs(schema) {
  const out = {};
  for (const [k, p] of Object.entries(schema.properties || {})) {
    const bits = [p.type || "string"];
    if ((schema.required || []).includes(k)) bits.push("required");
    if (p.enum) bits.push(`one of ${p.enum.join("|")}`);
    if (p.default !== undefined) bits.push(`default ${p.default}`);
    if (p.minimum !== undefined || p.maximum !== undefined) bits.push(`${p.minimum ?? ""}..${p.maximum ?? ""}`);
    if (p.description) bits.push(p.description);
    out[k] = bits.join(", ");
  }
  return out;
}

/** Rank operations by keyword overlap with the query. */
export function searchOperations(registry, { query = "", connector, limit = 8 } = {}) {
  const words = tokenize(query);
  const max = Math.min(Math.max(Number(limit) || 8, 1), 50);
  const scored = [];
  for (const t of listTools(registry)) {
    const entry = registry.tools.get(t.name);
    if (connector && entry.connector.name !== connector) continue;
    const name = t.name.toLowerCase();
    const hay = `${t.description} ${entry.connector.description || ""} ${Object.keys(t.inputSchema.properties).join(" ")}`.toLowerCase();
    let score = words.length ? 0 : 1;
    for (const w of words) {
      if (name.includes(w)) score += 3;
      if (hay.includes(w)) score += 1;
    }
    if (score > 0) scored.push({ score, t });
  }
  scored.sort((a, b) => b.score - a.score || a.t.name.localeCompare(b.t.name));
  return {
    total_operations: registry.tools.size,
    matches: scored.slice(0, max).map(({ t }) => ({
      operation: t.name,
      description: t.description,
      method: t.annotations.readOnlyHint ? "read" : "write",
      arguments: compactArgs(t.inputSchema),
    })),
  };
}

/** True when this request should be served in catalog mode. */
export function catalogMode(env = {}, url) {
  const q = url ? url.searchParams.get("mode") : null;
  if (q === "catalog") return true;
  if (q === "tools") return false;
  return String(env.TOOL_MODE || "").toLowerCase() === "catalog";
}
