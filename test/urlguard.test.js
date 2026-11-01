import test from "node:test";
import assert from "node:assert/strict";
import { checkPublicUrl } from "../src/urlguard.js";
import { checkArgs } from "../src/executor.js";
import reader from "../connectors/reader.js";

const bad = [
  "http://localhost/", "http://127.0.0.1/", "http://2130706433/", "http://0x7f000001/",
  "http://10.0.0.5/x", "http://172.16.1.1/", "http://192.168.1.1/", "http://169.254.169.254/latest/meta-data",
  "http://100.64.0.1/", "http://0.0.0.0/", "http://[::1]/", "http://[fd00::1]/", "http://[fe80::1]/",
  "http://[::ffff:127.0.0.1]/", "http://printer.local/", "http://db.internal/", "http://intranet/",
  "http://user:pass@example.com/", "ftp://example.com/", "file:///etc/passwd", "http://example.com:22/",
];
const good = ["https://example.com/", "http://en.wikipedia.org/wiki/MCP", "https://8.8.8.8/", "https://example.com:8443/a?b=1"];

test("checkPublicUrl rejects private and local targets", () => {
  for (const u of bad) assert.throws(() => checkPublicUrl(u), undefined, u);
});
test("checkPublicUrl allows public URLs", () => {
  for (const u of good) assert.doesNotThrow(() => checkPublicUrl(u), u);
});
test("reader.read enforces the guard via checkArgs", () => {
  const tool = reader.tools[0];
  assert.throws(() => checkArgs(tool, { url: "http://169.254.169.254/" }), /private/);
  assert.equal(checkArgs(tool, { url: "https://example.com/" }).url, "https://example.com/");
});
