import { render, renderPath, pick, project, OMIT } from "./template.js";
import { xmlToJson } from "./xml.js";

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_CHARS = 20000;

/** Check arguments against the tool's declared params. Returns cleaned args. */
export function checkArgs(tool, args = {}) {
  const params = tool.params || {};
  const clean = {};
  for (const [name, p] of Object.entries(params)) {
    let v = args[name];
    if (v === undefined || v === null || v === "") {
      if (p.default !== undefined) v = p.default;
      else if (p.required) throw new Error(`Missing required argument: ${name}`);
      else continue;
    }
    if (p.type === "number" || p.type === "integer") {
      const n = Number(v);
      if (Number.isNaN(n)) throw new Error(`Argument ${name} must be a number`);
      if (p.minimum !== undefined && n < p.minimum) throw new Error(`${name} must be >= ${p.minimum}`);
      if (p.maximum !== undefined && n > p.maximum) throw new Error(`${name} must be <= ${p.maximum}`);
      v = p.type === "integer" ? Math.trunc(n) : n;
    } else if (p.type === "boolean") {
      v = v === true || v === "true";
    } else {
      v = String(v);
      if (p.enum && !p.enum.includes(v)) throw new Error(`Argument ${name} must be one of: ${p.enum.join(", ")}`);
      if (p.pattern && !new RegExp(p.pattern).test(v)) throw new Error(`Argument ${name} must match ${p.pattern}`);
      if (p.maxLength && v.length > p.maxLength) throw new Error(`Argument ${name} is too long`);
    }
    clean[name] = v;
  }
  for (const k of Object.keys(args)) {
    if (!(k in params)) throw new Error(`Unknown argument: ${k}`);
  }
  return clean;
}

/** Build the outgoing HTTP request for a tool call (pure; easy to test). */
export function buildRequest(connector, tool, rawArgs, env = {}) {
  const args = checkArgs(tool, rawArgs);
  const base = new URL(connector.baseUrl);
  const url = new URL(base.pathname.replace(/\/$/, "") + renderPath(tool.path, args), base);

  const query = render({ ...(connector.query || {}), ...(tool.query || {}) }, args, env);
  for (const [k, v] of Object.entries(query)) {
    if (v === OMIT) continue;
    url.searchParams.set(k, String(v));
  }

  const headers = {
    "user-agent": "web2mcp/0.1 (+https://github.com/charleswei118/web2mcp)",
    accept: tool.response === "xml"
      ? "application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5"
      : "application/json, text/plain;q=0.9, */*;q=0.5",
    ...render(connector.headers || {}, args, env),
    ...render(tool.headers || {}, args, env),
  };

  const method = (tool.method || "GET").toUpperCase();
  let body;
  if (tool.body !== undefined && method !== "GET") {
    const b = render(tool.body, args, env);
    body = typeof b === "string" ? b : JSON.stringify(b);
    if (!Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
      headers["content-type"] = "application/json";
    }
  }

  if (url.host !== base.host) throw new Error("Refusing to call a host outside the connector's baseUrl");
  return { url: url.toString(), method, headers, body };
}

function shape(tool, data) {
  let out = data;
  if (tool.pick) out = pick(out, tool.pick);
  if (tool.fields) out = project(out, tool.fields);
  if (tool.limit && Array.isArray(out)) out = out.slice(0, tool.limit);
  return out;
}

/** Execute a tool call and return MCP `content` text. */
export async function execute(connector, tool, args, env = {}, fetchImpl = fetch) {
  const req = buildRequest(connector, tool, args, env);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), connector.timeoutMs || DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetchImpl(req.url, { method: req.method, headers: req.headers, body: req.body, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
  const ctype = res.headers.get("content-type") || "";
  const raw = await res.text();
  if (!res.ok) {
    return { isError: true, text: `Upstream ${res.status} ${res.statusText}: ${raw.slice(0, 500)}` };
  }
  let text;
  const mode = tool.response || "auto";
  if (mode === "xml") {
    let data;
    try {
      data = xmlToJson(raw);
    } catch (e) {
      return { isError: true, text: `Could not parse XML response: ${e.message}` };
    }
    text = JSON.stringify(shape(tool, data), null, 2);
  } else if (mode !== "text" && (mode === "json" || ctype.includes("json") || /^[\[{]/.test(raw.trim()))) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    const shaped = shape(tool, data);
    text = typeof shaped === "string" ? shaped : JSON.stringify(shaped, null, 2);
  } else {
    text = raw;
  }
  const max = Number(env.MAX_OUTPUT_CHARS) || DEFAULT_MAX_CHARS;
  if (text.length > max) text = text.slice(0, max) + `\n…[truncated ${text.length - max} chars]`;
  return { isError: false, text };
}
