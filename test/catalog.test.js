import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";
import { buildRegistry } from "../src/registry.js";
import { handleRpc } from "../src/mcp.js";
import { searchOperations, catalogMode } from "../src/catalog.js";

const rpc = (path, body, env = {}) =>
  worker.fetch(
    new Request(`https://gw.example${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
  );

test("catalogMode: env and ?mode override", () => {
  assert.equal(catalogMode({}, new URL("https://x/mcp")), false);
  assert.equal(catalogMode({ TOOL_MODE: "catalog" }, new URL("https://x/mcp")), true);
  assert.equal(catalogMode({}, new URL("https://x/mcp?mode=catalog")), true);
  assert.equal(catalogMode({ TOOL_MODE: "catalog" }, new URL("https://x/mcp?mode=tools")), false);
});

test("catalog tools/list exposes exactly two tools", async () => {
  const r = await (await rpc("/mcp?mode=catalog", { jsonrpc: "2.0", id: 1, method: "tools/list" })).json();
  assert.deepEqual(r.result.tools.map((t) => t.name), ["search_api", "call_api"]);
  const full = await (await rpc("/mcp", { jsonrpc: "2.0", id: 1, method: "tools/list" })).json();
  assert.ok(full.result.tools.length > 2);
});

test("searchOperations ranks by keywords and filters by connector", () => {
  const reg = buildRegistry({});
  const r = searchOperations(reg, { query: "weather forecast" });
  assert.equal(r.matches[0].operation, "weather_forecast");
  assert.ok(r.matches[0].arguments.latitude.includes("required"));
  const gh = searchOperations(reg, { query: "", connector: "github" });
  assert.deepEqual(gh.matches.map((m) => m.operation).sort(), ["github_repo", "github_search_repos"]);
  assert.equal(searchOperations(reg, { query: "zzqqxx" }).matches.length, 0);
});

test("call_api dispatches to the underlying operation", async () => {
  const reg = buildRegistry({});
  const fakeFetch = async (url) => {
    assert.match(url, /hn\.algolia\.com/);
    return new Response(JSON.stringify({ hits: [{ title: "T", url: "u", points: 5, num_comments: 1, objectID: "9" }] }), {
      headers: { "content-type": "application/json" },
    });
  };
  const r = await handleRpc(
    { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "call_api", arguments: { operation: "hackernews_search", arguments: { query: "mcp" } } } },
    reg, {}, fakeFetch, { catalog: true },
  );
  assert.equal(r.result.isError, false);
  assert.match(r.result.content[0].text, /"T"/);
  const bad = await handleRpc(
    { jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "call_api", arguments: { operation: "nope" } } },
    reg, {}, fakeFetch, { catalog: true },
  );
  assert.equal(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /search_api/);
});
