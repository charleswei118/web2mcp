import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { buildRegistry, validateConnector } from "../src/registry.js";
import { buildRequest } from "../src/executor.js";
import { handleRpc } from "../src/mcp.js";
import { render, pick, project, OMIT } from "../src/template.js";

const rpc = (body, env = {}, headers = {}) =>
  worker.fetch(
    new Request("https://gw.example/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    env,
  );

test("templates keep types, drop missing optionals, read secrets", () => {
  assert.equal(render("{n}", { n: 3 }), 3);
  assert.equal(render("{n}", {}), OMIT);
  assert.deepEqual(render({ a: "{x}", b: "k={x}" }, { x: "1" }), { a: "1", b: "k=1" });
  assert.equal(render("Bearer ${TOKEN}", {}, { TOKEN: "t" }), "Bearer t");
  assert.throws(() => render("${NOPE}", {}, {}), /Missing secret/);
  assert.deepEqual(render({ h: "Bearer ${?NOPE}", k: 1 }, {}, {}), { k: 1 });
  assert.equal(render("Bearer ${?T}", {}, { T: "x" }), "Bearer x");
});

test("pick / project", () => {
  const d = { a: { items: [{ x: 1, y: { z: 2 } }, { x: 3, y: { z: 4 } }] } };
  assert.deepEqual(pick(d, "a.items.*.x"), [1, 3]);
  assert.deepEqual(project(d.a.items, ["x", "zz=y.z"]), [{ x: 1, zz: 2 }, { x: 3, zz: 4 }]);
});

test("all built-in connectors are valid", () => {
  const reg = buildRegistry({});
  for (const c of reg.connectors) assert.deepEqual(validateConnector(c), [], c.name);
  assert.ok(reg.tools.size >= 10);
});

test("ENABLED_CONNECTORS and CONNECTORS_JSON", () => {
  const extra = { name: "demo", description: "d", baseUrl: "https://example.com", tools: [{ name: "x", description: "x", path: "/x" }] };
  const reg = buildRegistry({ ENABLED_CONNECTORS: "demo,wikipedia", CONNECTORS_JSON: JSON.stringify([extra]) });
  assert.deepEqual([...reg.tools.keys()].sort(), ["demo_x", "wikipedia_search", "wikipedia_summary"]);
});

test("buildRequest encodes path args, applies defaults and validation", () => {
  const { tools } = buildRegistry({});
  const s = tools.get("wikipedia_summary");
  assert.equal(buildRequest(s.connector, s.tool, { title: "C++ (language)" }).url,
    "https://en.wikipedia.org/api/rest_v1/page/summary/C%2B%2B%20(language)");
  const h = tools.get("hackernews_search");
  const r = buildRequest(h.connector, h.tool, { query: "mcp" });
  assert.match(r.url, /hitsPerPage=10/);
  assert.throws(() => buildRequest(h.connector, h.tool, {}), /Missing required/);
  assert.throws(() => buildRequest(h.connector, h.tool, { query: "a", limit: 99 }), /<= 30/);
  assert.throws(() => buildRequest(h.connector, h.tool, { query: "a", bogus: 1 }), /Unknown argument/);
  const rd = tools.get("reader_read");
  assert.throws(() => buildRequest(rd.connector, rd.tool, { url: "file:///etc/passwd" }), /must match/);
});

test("MCP initialize, tools/list, notifications", async () => {
  const init = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } })).json();
  assert.equal(init.result.protocolVersion, "2025-06-18");
  assert.equal(init.result.serverInfo.name, "web2mcp");
  const n = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(n.status, 202);
  const list = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
  const names = list.result.tools.map((t) => t.name);
  assert.ok(names.includes("weather_forecast"));
  assert.equal(list.result.tools[0].inputSchema.type, "object");
  const bad = await (await rpc({ jsonrpc: "2.0", id: 3, method: "nope" })).json();
  assert.equal(bad.error.code, -32601);
});

test("tools/call with mocked upstream shapes the output", async () => {
  const reg = buildRegistry({});
  const fakeFetch = async (url) => {
    assert.match(url, /hn\.algolia\.com/);
    return new Response(JSON.stringify({ hits: [{ title: "T", url: "u", points: 5, num_comments: 1, objectID: "9", junk: "x" }] }), {
      headers: { "content-type": "application/json" },
    });
  };
  const res = await handleRpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "hackernews_front_page", arguments: {} } }, reg, {}, fakeFetch);
  assert.equal(res.result.isError, false);
  assert.deepEqual(JSON.parse(res.result.content[0].text), [{ title: "T", url: "u", points: 5, num_comments: 1, id: "9" }]);
  const err = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "hackernews_search", arguments: {} } }, reg, {}, fakeFetch);
  assert.equal(err.result.isError, true);
});

test("AUTH_TOKEN protects /mcp", async () => {
  const env = { AUTH_TOKEN: "s3cret" };
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, env)).status, 401);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, env, { authorization: "Bearer s3cret" })).status, 200);
});
