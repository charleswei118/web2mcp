import builtins from "../connectors/index.js";

const NAME_RE = /^[a-z][a-z0-9_]{0,31}$/;

/**
 * Validate a connector definition and return a list of problems (empty = valid).
 * See docs in README: "Write a connector".
 */
export function validateConnector(c) {
  const errs = [];
  if (!c || typeof c !== "object") return ["connector must be an object"];
  if (!NAME_RE.test(c.name || "")) errs.push(`invalid connector name "${c.name}" (a-z, 0-9, _; max 32)`);
  if (!c.description) errs.push(`${c.name}: description is required`);
  try {
    const u = new URL(c.baseUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") errs.push(`${c.name}: baseUrl must be http(s)`);
  } catch {
    errs.push(`${c.name}: baseUrl must be an absolute URL`);
  }
  if (!Array.isArray(c.tools) || !c.tools.length) errs.push(`${c.name}: tools[] is required`);
  for (const t of c.tools || []) {
    if (!NAME_RE.test(t.name || "")) errs.push(`${c.name}: invalid tool name "${t.name}"`);
    if (!t.description) errs.push(`${c.name}.${t.name}: description is required`);
    if (typeof t.path !== "string" || !t.path.startsWith("/")) errs.push(`${c.name}.${t.name}: path must start with "/"`);
    const m = (t.method || "GET").toUpperCase();
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(m)) errs.push(`${c.name}.${t.name}: bad method ${m}`);
    if (t.response !== undefined && !["auto", "json", "xml", "text"].includes(t.response)) {
      errs.push(`${c.name}.${t.name}: response must be "auto", "json", "xml" or "text"`);
    }
  }
  return errs;
}

/** Turn a connector tool's `params` into an MCP / JSON-Schema inputSchema. */
export function toInputSchema(params = {}) {
  const properties = {};
  const required = [];
  for (const [name, p] of Object.entries(params)) {
    const { required: req, ...schema } = p;
    properties[name] = { type: "string", ...schema };
    if (schema.format === "public-url") properties[name].format = "uri";
    if (req) required.push(name);
  }
  return { type: "object", properties, required, additionalProperties: false };
}

/**
 * Build the tool registry from built-in connectors + optional extra connectors
 * supplied at deploy time through the CONNECTORS_JSON variable.
 * ENABLED_CONNECTORS (comma list) restricts which connectors are exposed.
 */
export function buildRegistry(env = {}) {
  let connectors = [...builtins];
  if (env.CONNECTORS_JSON) {
    let extra;
    try {
      extra = JSON.parse(env.CONNECTORS_JSON);
    } catch (e) {
      throw new Error(`CONNECTORS_JSON is not valid JSON: ${e.message}`);
    }
    connectors = connectors.concat(Array.isArray(extra) ? extra : [extra]);
  }
  if (env.ENABLED_CONNECTORS) {
    const allow = new Set(String(env.ENABLED_CONNECTORS).split(",").map((s) => s.trim()).filter(Boolean));
    connectors = connectors.filter((c) => allow.has(c.name));
  }

  const tools = new Map();
  for (const c of connectors) {
    const errs = validateConnector(c);
    if (errs.length) throw new Error(`Invalid connector: ${errs.join("; ")}`);
    for (const t of c.tools) {
      const fullName = `${c.name}_${t.name}`;
      if (tools.has(fullName)) throw new Error(`Duplicate tool name ${fullName}`);
      tools.set(fullName, { connector: c, tool: t });
    }
  }
  return { connectors, tools };
}

export function listTools(registry) {
  return [...registry.tools.entries()].map(([name, { connector, tool }]) => ({
    name,
    title: `${connector.title || connector.name}: ${tool.title || tool.name}`,
    description: `[${connector.name}] ${tool.description}`,
    inputSchema: toInputSchema(tool.params),
    annotations: {
      readOnlyHint: (tool.method || "GET").toUpperCase() === "GET",
      openWorldHint: true,
    },
  }));
}
