<div align="center">

# web2mcp

**把任意网站或 REST API 变成 MCP 工具 —— 一个 Cloudflare Worker，零依赖。**

[English](README.md) · [简体中文](README.zh-CN.md)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/charleswei118/web2mcp)

</div>

现在的 AI 智能体（Claude、ChatGPT、Cursor、各种自建 Agent）都在用 **MCP（Model Context Protocol）** 调用外部工具，但大多数网站和 APP 并不支持。`web2mcp` 就是中间的“转换插头”：用几行配置描述一个 HTTP 接口，它立刻变成**任何** AI 都能调用的 MCP 工具，并免费托管在 Cloudflare 边缘网络上。这样不同的 AI 就能共用同一套工具，互联互通。

## 特点

- **写配置，不写代码**：一个连接器就是一个普通对象（地址、路径、参数）。
- **零运行时依赖**：约 500 行可读的 JavaScript，十分钟就能审完。
- **省 Token**：`pick`、`fields` 把庞大的 JSON 裁剪成模型真正需要的字段。
- **免费托管**：Cloudflare Workers 免费套餐即可运行，一键部署。
- **默认安全**：请求锁定在连接器声明的域名内，参数做类型校验，密钥只存在服务端，可开启 Bearer 鉴权。
- **OpenAPI 导入**：一条命令把 OpenAPI 3 规范转成连接器。

## 内置连接器（无需 API Key）

| 工具 | 功能 |
| --- | --- |
| `wikipedia_search` / `wikipedia_summary` | 维基百科搜索与摘要 |
| `hackernews_front_page` / `hackernews_search` | Hacker News 热门与搜索 |
| `geocode_search` | 地名转经纬度 |
| `weather_forecast` | 实时天气与逐日预报 |
| `currency_latest` | 欧洲央行汇率 |
| `github_search_repos` / `github_repo` | GitHub 公开仓库 |
| `reader_read` | 任意网页转 Markdown |

## 快速开始

```bash
git clone https://github.com/charleswei118/web2mcp && cd web2mcp
npm test            # 单元测试（Node 20+，无需安装依赖）
npm run smoke       # 真实调用所有内置工具
npx wrangler dev    # 本地运行：http://localhost:8787/mcp
npx wrangler deploy # 部署到 https://web2mcp.<你的子域>.workers.dev/mcp
npx wrangler secret put AUTH_TOKEN   # 可选：开启鉴权
```

## 接入 AI 客户端

Claude Desktop / Cursor 等（通过 `mcp-remote`）：

```json
{
  "mcpServers": {
    "web2mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://web2mcp.<你的子域>.workers.dev/mcp",
               "--header", "Authorization: Bearer ${WEB2MCP_TOKEN}"],
      "env": { "WEB2MCP_TOKEN": "你的令牌" }
    }
  }
}
```

原生支持远程 MCP 的客户端可直接填 URL。调试可用官方工具：`npx @modelcontextprotocol/inspector`。

## 编写连接器

在 `connectors/` 新建文件并加入 `connectors/index.js`，格式见英文 README 的 “Write a connector” 一节。规则速查：

| 写法 | 含义 |
| --- | --- |
| `"{arg}"` | 工具参数；整值引用时保留类型，可选参数缺省时自动省略 |
| `"${SECRET}"` | 读取 Worker 密钥，不会暴露给模型 |
| `pick: "a.b.*.c"` | 选取响应的一部分，`*` 遍历数组 |
| `fields: ["x", "别名=深层.路径"]` | 只保留这些字段 |

**不改代码也能加**：把连接器 JSON 数组放进 `CONNECTORS_JSON` 密钥即可；用 `ENABLED_CONNECTORS` 只开放部分连接器。

从 OpenAPI 生成：

```bash
node scripts/openapi2connector.js <spec.json 或 URL> 名称 --only GET > connectors/名称.js
```

## 路线图

- [ ] 基于 CSS 选择器的网页抓取连接器（HTMLRewriter）
- [ ] 按工具限流与 KV 缓存
- [ ] 需要登录账号的 OAuth 连接器
- [ ] 连接器共享市场
- [ ] 基于 Durable Objects 的 AI 互聊房间（A2A）

## 合规使用

只接入你有权使用的网站和 API，遵守各服务的条款、robots 规则与频率限制，密钥放在 Worker Secrets 中。

## 许可证

[MIT](LICENSE)。觉得有用请点个 ⭐，让更多人看到。
