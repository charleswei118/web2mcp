<div align="center">

# web2mcp

**Turn any website or REST API into MCP tools — one tiny Cloudflare Worker, zero dependencies.**

[English](README.md) · [简体中文](README.zh-CN.md)

[![CI](https://github.com/charleswei118/web2mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/charleswei118/web2mcp/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Runtime deps: 0](https://img.shields.io/badge/runtime%20deps-0-brightgreen)
![MCP](https://img.shields.io/badge/MCP-2025--06--18-purple)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/charleswei118/web2mcp)

**GitHub's 665 REST endpoints → 2 MCP tools, ~147,000 tokens of tool definitions → ~300** ([catalog mode](#catalog-mode-665-endpoints-2-tools))

</div>

Every AI agent (Claude, ChatGPT, Cursor, your own bots…) now speaks the **Model Context Protocol**. But most websites and apps don't. `web2mcp` is the glue: describe an HTTP API in a few lines of config and it instantly becomes an MCP tool that **any** agent can call — hosted for free on Cloudflare's edge.

```
 Claude / Cursor / any MCP client
              │  MCP (Streamable HTTP, JSON-RPC)
              ▼
   ┌──────────────────────────┐
   │  web2mcp  (CF Worker)    │  connectors/*.js  or  CONNECTORS_JSON
   └──────────────────────────┘
      │        │        │
   Wikipedia  GitHub  any REST API / web page …
```

## Try it now

A public demo is running at **https://web2mcp.cwei59969.workers.dev** (tool list) with the MCP endpoint at:

```
https://web2mcp.cwei59969.workers.dev/mcp
```

Paste it into any client that supports remote MCP servers, or:

```bash
curl -s https://web2mcp.cwei59969.workers.dev/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"weather_forecast","arguments":{"latitude":35.68,"longitude":139.69}}}'
```

The demo is rate-limited by the free plan and has `reader_read` disabled. Deploy your own for real use.

## Why

- **Config, not code.** A connector is a plain object: base URL, path, query, params. No SDK to learn.
- **Zero runtime dependencies.** ~500 lines of readable JavaScript. Audit it in 10 minutes.
- **Token-friendly output.** `pick` and `fields` trim giant JSON responses down to what the model needs.
- **Free hosting.** Runs on the Cloudflare Workers free plan. Deploy in one click.
- **Safe by default.** Requests are locked to each connector's host, arguments are type-checked, secrets stay server-side, optional bearer auth.
- **OpenAPI import.** Convert any OpenAPI 3 spec into a connector with one command.

## Built-in connectors (no API keys)

| Tool | What it does |
| --- | --- |
| `wikipedia_search`, `wikipedia_summary` | Search Wikipedia, read article summaries |
| `hackernews_front_page`, `hackernews_search` | Hacker News stories |
| `geocode_search` | Place name → coordinates (Open-Meteo) |
| `weather_forecast` | Current weather + daily forecast (Open-Meteo) |
| `currency_latest` | ECB exchange rates (Frankfurter) |
| `github_search_repos`, `github_repo` | Public GitHub repositories (set `GITHUB_TOKEN` on Workers: shared IPs hit GitHub's anonymous limit) |
| `reader_read` | Any web page → clean Markdown (Jina Reader) |
| `npm_package`, `npmstats_downloads` | npm package info and weekly downloads |
| `arxiv_search` | Search arXiv research papers |

## Deploy your own in one click

Click **Deploy to Cloudflare** above. Cloudflare copies this repo into your GitHub account, asks for an `AUTH_TOKEN` (any long random string, e.g. `openssl rand -hex 32`), then builds and deploys it. A minute later your server is live at `https://web2mcp.<your-subdomain>.workers.dev/mcp`, and every push to your copy redeploys it. The free Workers plan is enough.

## Quick start

```bash
git clone https://github.com/charleswei118/web2mcp && cd web2mcp
npm test                 # unit tests, no install needed (Node 20+)
npm run smoke            # calls every built-in tool against the real APIs
npx wrangler dev         # local server at http://localhost:8787/mcp
npx wrangler deploy      # your own https://web2mcp.<you>.workers.dev/mcp
```

Optional: protect your endpoint

```bash
npx wrangler secret put AUTH_TOKEN
```

## Connect an AI client

**Claude Desktop / Cursor / Windsurf** (via `mcp-remote`):

```json
{
  "mcpServers": {
    "web2mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://web2mcp.<you>.workers.dev/mcp",
               "--header", "Authorization: Bearer ${WEB2MCP_TOKEN}"],
      "env": { "WEB2MCP_TOKEN": "your-token" }
    }
  }
}
```

**Run locally over stdio** (no Cloudflare account needed; same connectors):

```json
{
  "mcpServers": {
    "web2mcp": {
      "command": "npx",
      "args": ["-y", "github:charleswei118/web2mcp"],
      "env": { "ENABLED_CONNECTORS": "wikipedia,hackernews,weather" }
    }
  }
}
```

Or with Docker: `docker build -t web2mcp . && docker run -i --rm web2mcp`. Environment variables work the same as Worker bindings (`ENABLED_CONNECTORS`, `CONNECTORS_JSON`, `MAX_OUTPUT_CHARS`, `TOOL_MODE=catalog`).

Clients that support remote MCP servers natively (Claude.ai custom connectors, ChatGPT connectors, the OpenAI Responses API, Cloudflare AI Playground…) can use the URL directly. Test with the official inspector:

```bash
npx @modelcontextprotocol/inspector   # transport: Streamable HTTP, URL: .../mcp
```

## Write a connector

Create `connectors/myapi.js` and add it to `connectors/index.js`:

```js
export default {
  name: "openlibrary",                       // tool names become openlibrary_<tool>
  description: "Search books on Open Library.",
  baseUrl: "https://openlibrary.org",
  headers: { /* "authorization": "Bearer ${MY_API_KEY}" */ },
  tools: [
    {
      name: "search",
      description: "Search books by title or author.",
      method: "GET",                          // GET | POST | PUT | PATCH | DELETE
      path: "/search.json",                   // "{arg}" in the path is URL-encoded
      query: { q: "{query}", limit: "{limit}" },
      params: {
        query: { type: "string", required: true, description: "Title or author" },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
      },
      pick: "docs",                           // dotted path into the JSON response
      fields: ["title", "author=author_name", "year=first_publish_year"],
    },
  ],
};
```

Template rules:

| Syntax | Meaning |
| --- | --- |
| `"{arg}"` | Tool argument. As a whole value it keeps its type; missing optional args are dropped. |
| `"${SECRET}"` | Read from a Worker secret / var — never exposed to the model. |
| `"${?SECRET}"` | Optional secret: the value is dropped when it is not set. |
| `pick: "a.b.*.c"` | Select part of the response (`*` maps over arrays; a single value counts as a one-item list). |
| `fields: ["x", "alias=deep.path"]` | Keep only these fields. |
| `limit: 10` | Truncate arrays. |
| `format: "public-url"` (on a param) | Reject localhost, private/intranet IPs, cloud metadata, embedded credentials and odd ports before any request is made (SSRF guard). Used by `reader_read`. |
| `response: "xml"` | Parse an XML/Atom/RSS response into JSON first, so `pick` / `fields` work on it (attributes become `@name`, namespace prefixes are dropped, repeated elements become arrays). Also `"json"`, `"text"` (raw body) or `"auto"` (default). |

**No-code option:** put connectors in the `CONNECTORS_JSON` secret (a JSON array of the same objects) and they appear without touching the code. Use `ENABLED_CONNECTORS="wikipedia,weather"` to expose only some.

### From an OpenAPI spec

```bash
node scripts/openapi2connector.js https://petstore3.swagger.io/api/v3/openapi.json petstore --only GET > connectors/petstore.js
```

## Catalog mode: 665 endpoints, 2 tools

Exposing every endpoint as its own tool floods the model's context. In catalog mode web2mcp exposes just two tools:

- `search_api` — find operations by keywords; returns their names and argument schemas
- `call_api` — run one operation by name with an arguments object

Measured with GitHub's full REST OpenAPI spec (GET operations only, converted with `scripts/openapi2connector.js`):

| Mode | Tools in `tools/list` | Approx. context |
| --- | --- | --- |
| Default (one tool per endpoint) | 665 | ~147,000 tokens |
| Catalog | 2 | ~300 tokens |

Turn it on per request with `/mcp?mode=catalog`, or for the whole deployment with the variable `TOOL_MODE = "catalog"` (`?mode=tools` switches back). Try it on the demo: `https://web2mcp.cwei59969.workers.dev/mcp?mode=catalog`.

## Endpoints

| Path | |
| --- | --- |
| `POST /mcp` | MCP Streamable HTTP endpoint (JSON responses, batch supported) |
| `POST /mcp?mode=catalog` | Same, in catalog mode (`search_api` + `call_api`) |
| `GET /` | Human-readable list of tools |
| `GET /tools` | Tool list as JSON |
| `GET /health` | Health check |

Supported MCP methods: `initialize`, `ping`, `tools/list`, `tools/call`, plus empty `resources/list` and `prompts/list`. Protocol versions `2025-06-18`, `2025-03-26`, `2024-11-05`.

## Roadmap

- [x] Catalog mode (`search_api` + `call_api`) — v0.2
- [ ] Load OpenAPI specs at runtime from a URL
- [x] One-click “Deploy to Cloudflare” — v0.2
- [ ] HTML scraping connectors (CSS selectors via `HTMLRewriter`)
- [ ] Per-tool rate limits and KV caching
- [ ] OAuth for connectors that need user accounts
- [ ] Connector registry: share connectors as JSON files
- [ ] Agent-to-agent (A2A) chat rooms on Durable Objects

PRs with new connectors are very welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Responsible use

Only connect APIs and sites you are allowed to use. Respect each service's terms, robots rules and rate limits, and keep credentials in Worker secrets.

## License

[MIT](LICENSE)

If web2mcp saves you time, please ⭐ the repo — it helps others find it.
