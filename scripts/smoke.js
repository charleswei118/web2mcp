// Live smoke test: calls every built-in tool against the real upstream APIs.
// Usage: node scripts/smoke.js            (runs the worker in-process)
//        MCP_URL=https://your.workers.dev/mcp node scripts/smoke.js   (tests a deployment)
import worker from "../src/index.js";

const CASES = {
  wikipedia_search: { query: "Model Context Protocol", limit: 2 },
  wikipedia_summary: { title: "Cloudflare" },
  hackernews_front_page: { limit: 3 },
  hackernews_search: { query: "MCP", limit: 2 },
  geocode_search: { name: "Shanghai", limit: 1 },
  weather_forecast: { latitude: 31.23, longitude: 121.47, days: 2 },
  currency_latest: { base: "USD", symbols: "CNY,EUR" },
  github_search_repos: { query: "model context protocol", limit: 2 },
  github_repo: { owner: "modelcontextprotocol", repo: "servers" },
  reader_read: { url: "https://example.com" },
  npm_package: { name: "@modelcontextprotocol/sdk" },
  npmstats_downloads: { name: "@modelcontextprotocol/sdk" },
};

const remote = process.env.MCP_URL;
async function call(body) {
  const init = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
  if (process.env.MCP_TOKEN) init.headers.authorization = `Bearer ${process.env.MCP_TOKEN}`;
  const res = remote ? await fetch(remote, init) : await worker.fetch(new Request("http://local/mcp", init), process.env);
  return res.json();
}

let failed = 0;
for (const [name, args] of Object.entries(CASES)) {
  const r = await call({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const text = r.result?.content?.[0]?.text ?? JSON.stringify(r.error);
  const bad = !r.result || r.result.isError;
  if (bad) failed++;
  console.log(`${bad ? "FAIL" : " ok "} ${name.padEnd(22)} ${text.replace(/\s+/g, " ").slice(0, 110)}`);
}
process.exit(failed ? 1 : 0);
