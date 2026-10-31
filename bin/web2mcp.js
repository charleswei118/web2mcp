#!/usr/bin/env node
// Local stdio MCP server: `node bin/web2mcp.js` or `npx github:charleswei118/web2mcp`.
import { runStdio } from "../src/stdio.js";

runStdio().catch((e) => {
  process.stderr.write(`web2mcp: ${e.message}\n`);
  process.exit(1);
});
