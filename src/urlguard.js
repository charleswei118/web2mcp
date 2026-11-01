/**
 * Reject URLs that point at private, loopback, link-local or otherwise
 * non-public destinations (basic SSRF guard). Hostnames are checked
 * syntactically; DNS-based checks are left to the fetching service.
 */
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".corp", ".intranet"];

function ipv4Private(h) {
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

function ipv6Private(h) {
  if (!h.startsWith("[")) return null;
  const ip = h.slice(1, -1).toLowerCase();
  if (ip === "::" || ip === "::1") return true;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]);
  if (/^::ffff:/.test(ip)) return true; // hex-form mapped IPv4: refuse
  return /^(fc|fd|fe[89ab]|ff)/.test(ip);
}

export function checkPublicUrl(value) {
  let u;
  try {
    u = new URL(value);
  } catch {
    throw new Error("URL is not valid");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs are allowed");
  if (u.username || u.password) throw new Error("URLs with credentials are not allowed");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new Error("URL points to a private or local host");
  }
  if (ipv4Private(host) || ipv6Private(host)) throw new Error("URL points to a private or local address");
  if (!host.includes(".") && !host.startsWith("[")) throw new Error("URL host must be a public domain name");
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) throw new Error("URL port is not allowed");
  return u.toString();
}
