# Changelog

## Unreleased

- Local stdio transport: `npx github:charleswei118/web2mcp` or `node bin/web2mcp.js`, same connectors and catalog mode as the Worker.
- Dockerfile for running the stdio server in a container (used by Glama checks).
- `response: "xml"` for connectors: XML/Atom/RSS responses are converted to JSON (built-in, zero dependencies) so `pick` / `fields` / `limit` work on them, including in `CONNECTORS_JSON`. Also `response: "json"` / `"text"` to force a mode.
- `pick`: `*` now treats a single value as a one-item list.

## 0.2.0 (2026-10-31)

- **Catalog mode**: expose two tools, `search_api` and `call_api`, instead of one per endpoint. GitHub's full REST spec (665 GET operations) drops from ~147,000 tokens of tool definitions to ~300. Enable per request with `/mcp?mode=catalog` or per deployment with `TOOL_MODE = "catalog"`.
- **One-click deploy**: the Deploy to Cloudflare button now prompts for `AUTH_TOKEN` (`.dev.vars.example`) and shows descriptions for each setting.
- `scripts/openapi2connector.js`: fix an infinite loop when truncated tool names collide.
- Published to the official MCP Registry as `io.github.charleswei118/web2mcp`.

## 0.1.0 (2026-10-31)

- First release: config-driven connectors, 9 built-in keyless tools, OpenAPI import, bearer auth, Streamable HTTP.
