# Runs web2mcp as a local stdio MCP server (same connectors as the Worker).
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY connectors ./connectors
COPY bin ./bin
ENV ENABLED_CONNECTORS="" MAX_OUTPUT_CHARS=20000
ENTRYPOINT ["node", "bin/web2mcp.js"]
