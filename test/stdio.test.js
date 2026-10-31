import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { handleLine, envFromProcess } from "../src/stdio.js";
import { buildRegistry } from "../src/registry.js";

test("handleLine: initialize, tools/list, notification, parse error", async () => {
  const env = {};
  const reg = buildRegistry(env);
  const init = JSON.parse(await handleLine('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}', reg, env));
  assert.equal(init.result.serverInfo.name, "web2mcp");
  const list = JSON.parse(await handleLine('{"jsonrpc":"2.0","id":2,"method":"tools/list"}', reg, env));
  assert.ok(list.result.tools.length > 0);
  assert.equal(await handleLine('{"jsonrpc":"2.0","method":"notifications/initialized"}', reg, env), null);
  assert.equal(JSON.parse(await handleLine("{bad", reg, env)).error.code, -32700);
});

test("handleLine: catalog mode via TOOL_MODE", async () => {
  const env = { TOOL_MODE: "catalog" };
  const reg = buildRegistry(env);
  const list = JSON.parse(await handleLine('{"jsonrpc":"2.0","id":1,"method":"tools/list"}', reg, env));
  assert.deepEqual(list.result.tools.map((t) => t.name).sort(), ["call_api", "search_api"]);
});

test("envFromProcess keeps known keys and secrets only", () => {
  const env = envFromProcess({ ENABLED_CONNECTORS: "wikipedia", GITHUB_TOKEN: "x", HOME: "/root", PATH: "/bin" });
  assert.deepEqual(env, { ENABLED_CONNECTORS: "wikipedia", GITHUB_TOKEN: "x" });
});

test("bin/web2mcp.js speaks MCP over stdio", async () => {
  const child = spawn(process.execPath, ["bin/web2mcp.js"], { env: { ...process.env, ENABLED_CONNECTORS: "wikipedia" } });
  let out = "";
  child.stdout.on("data", (d) => (out += d));
  child.stdin.write('{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\n');
  child.stdin.write('{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n');
  child.stdin.end();
  await new Promise((r) => child.on("close", r));
  const lines = out.trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 2);
  const list = lines.find((l) => l.id === 2);
  assert.ok(list.result.tools.every((t) => t.name.startsWith("wikipedia_")));
});
