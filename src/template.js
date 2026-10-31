// Tiny templating helpers used by connectors.
//   "{name}"   -> tool argument `name`
//   "${NAME}"  -> environment secret NAME (Cloudflare secret / var)
//   "${?NAME}" -> optional secret: if NAME is unset, the whole value is dropped

const ARG_RE = /\{([a-zA-Z0-9_]+)\}/g;
const ENV_RE = /\$\{(\??)([A-Z0-9_]+)\}/g;
const WHOLE_ARG_RE = /^\{([a-zA-Z0-9_]+)\}$/;

/** Marker returned when a template refers only to a missing optional argument. */
export const OMIT = Symbol("omit");

/**
 * Render a template value against tool arguments and env.
 * - A string that is exactly "{arg}" keeps the argument's original type.
 * - Missing args inside a whole-value template return OMIT (so the key is dropped).
 * - Objects / arrays are rendered recursively.
 */
export function render(value, args = {}, env = {}) {
  if (typeof value === "string") {
    const whole = value.match(WHOLE_ARG_RE);
    if (whole) {
      const v = args[whole[1]];
      return v === undefined || v === null || v === "" ? OMIT : v;
    }
    let missing = false;
    let optionalMissing = false;
    const out = value
      .replace(ENV_RE, (_, opt, name) => {
        const v = env[name];
        if (v === undefined || v === "") {
          if (opt) {
            optionalMissing = true;
            return "";
          }
          throw new Error(`Missing secret/env var: ${name}`);
        }
        return String(v);
      })
      .replace(ARG_RE, (_, name) => {
        const v = args[name];
        if (v === undefined || v === null) {
          missing = true;
          return "";
        }
        return String(v);
      });
    if (optionalMissing) return OMIT;
    return missing && out.trim() === "" ? OMIT : out;
  }
  if (Array.isArray(value)) {
    return value.map((v) => render(v, args, env)).filter((v) => v !== OMIT);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const r = render(v, args, env);
      if (r !== OMIT) out[k] = r;
    }
    return out;
  }
  return value;
}

/** Render a URL path, URL-encoding every substituted argument. */
export function renderPath(path, args = {}) {
  return path.replace(ARG_RE, (_, name) => {
    const v = args[name];
    if (v === undefined || v === null || v === "") {
      throw new Error(`Missing required path argument: ${name}`);
    }
    return encodeURIComponent(String(v));
  });
}

/** Read a dotted path ("data.items.0.title") out of an object. Supports "*" to map over arrays. */
export function pick(obj, path) {
  if (!path) return obj;
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (cur === undefined || cur === null) return undefined;
    if (p === "*") {
      if (!Array.isArray(cur)) return undefined;
      const rest = parts.slice(i + 1).join(".");
      return cur.map((item) => pick(item, rest));
    }
    cur = cur[p];
  }
  return cur;
}

/** Keep only the listed fields of each item (or of the object). */
export function project(value, fields) {
  if (!fields || !fields.length) return value;
  const one = (item) => {
    if (!item || typeof item !== "object") return item;
    const out = {};
    for (const f of fields) {
      const [alias, path] = f.includes("=") ? f.split("=") : [f.split(".").pop(), f];
      out[alias] = pick(item, path);
    }
    return out;
  };
  return Array.isArray(value) ? value.map(one) : one(value);
}
