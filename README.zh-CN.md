<div align="center">

# web2mcp

**把任意网站或 REST API 变成 MCP 工具 —— 一个 Cloudflare Worker，零依赖。**

[English](README.md) · [简体中文](README.zh-CN.md)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/charleswei118/web2mcp)

**GitHub 665 个 REST 接口 → 2 个 MCP 工具，工具定义从约 14.7 万 token 降到约 300**（见“目录模式”）

</div>

现在的 AI 智能体（Claude、ChatGPT、Cursor、各种自建 Agent）都在用 **MCP（Model Context Protocol）** 调用外部工具，但大多数网站和 APP 并不支持。`web2mcp` 就是中间的“转换插头”：用几行配置描述一个 HTTP 接口，它立刻变成**任何** AI 都能调用的 MCP 工具，并免费托管在 Cloudflare 边缘网络上。这样不同的 AI 就能共用同一套工具，互联互通。

## 一键部署

点上方 **Deploy to Cloudflare**：Cloudflare 会把本仓库复制到你的 GitHub 账号，让你填一个 `AUTH_TOKEN`（任意长随机串，比如 `openssl rand -hex 32` 生成），然后自动构建部署。约一分钟后，你的服务就在 `https://web2mcp.<你的子域>.workers.dev/mcp` 上线，之后每次推送到你的副本都会自动重新部署。Workers 免费套餐就够用。

## 在线体验

演示地址：**https://web2mcp.cwei59969.workers.dev**（工具列表），MCP 端点：

```
https://web2mcp.cwei59969.workers.dev/mcp
```

填进任何支持远程 MCP 的客户端即可，或直接用 curl：

```bash
curl -s https://web2mcp.cwei59969.workers.dev/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"weather_forecast","arguments":{"latitude":31.23,"longitude":121.47}}}'
```

演示版受免费额度限制，且关闭了 `reader_read`，正式使用请自行部署。

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
| `github_search_repos` / `github_repo` | GitHub 公开仓库（部署到 Workers 建议设置 `GITHUB_TOKEN`） |
| `reader_read` | 任意网页转 Markdown |
| `npm_package` / `npmstats_downloads` | npm 包信息与周下载量 |
| `arxiv_search` | 搜索 arXiv 论文 |
| `holidaycn_year` | 中国法定节假日与调休上班日（按年） |
| `baiduhot_realtime` | 百度实时热搜榜 |
| `shici_random` | 随机一句古诗词（今日诗词，可按主题） |
| `bilibili_popular`, `bilibili_ranking` | B 站综合热门 / 排行榜（仅本地 stdio 或自建服务器可用，B 站屏蔽 Cloudflare IP） |

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

本地 stdio 运行（无需 Cloudflare 账号，连接器相同）：

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

或用 Docker：`docker build -t web2mcp . && docker run -i --rm web2mcp`。环境变量与 Worker 绑定一致（`ENABLED_CONNECTORS`、`CONNECTORS_JSON`、`MAX_OUTPUT_CHARS`、`TOOL_MODE=catalog`）。

原生支持远程 MCP 的客户端可直接填 URL。调试可用官方工具：`npx @modelcontextprotocol/inspector`。

## 编写连接器

在 `connectors/` 新建文件并加入 `connectors/index.js`，格式见英文 README 的 “Write a connector” 一节。规则速查：

| 写法 | 含义 |
| --- | --- |
| `"{arg}"` | 工具参数；整值引用时保留类型，可选参数缺省时自动省略 |
| `"${SECRET}"` | 读取 Worker 密钥，不会暴露给模型 |
| `"${?SECRET}"` | 可选密钥，未设置时整项省略 |
| `pick: "a.b.*.c"` | 选取响应的一部分，`*` 遍历数组 |
| `fields: ["x", "别名=深层.路径"]` | 只保留这些字段 |
| `response: "xml"` | 先把 XML/Atom/RSS 响应转成 JSON，再用 `pick` / `fields` 筛选（属性变成 `@名称`，去掉命名空间前缀，重复元素变数组）。可选 `"json"`、`"text"`（原文）、`"auto"`（默认）。 |

**不改代码也能加**：把连接器 JSON 数组放进 `CONNECTORS_JSON` 密钥即可；用 `ENABLED_CONNECTORS` 只开放部分连接器。

从 OpenAPI 生成：

```bash
node scripts/openapi2connector.js <spec.json 或 URL> 名称 --only GET > connectors/名称.js
```

## 目录模式：665 个接口，只占 2 个工具

把每个接口都暴露成一个工具，会塞满模型的上下文。目录模式下 web2mcp 只暴露两个工具：

- `search_api`：按关键词查找可用操作，返回名称和参数说明
- `call_api`：按名称执行某个操作

用 GitHub 完整 REST OpenAPI（仅 GET 接口，经 `scripts/openapi2connector.js` 转换）实测：

| 模式 | `tools/list` 工具数 | 约占上下文 |
| --- | --- | --- |
| 默认（一个接口一个工具） | 665 | 约 147,000 tokens |
| 目录模式 | 2 | 约 300 tokens |

单次请求用 `/mcp?mode=catalog` 开启，或在部署变量里设 `TOOL_MODE = "catalog"` 全局开启（`?mode=tools` 切回）。演示地址：`https://web2mcp.cwei59969.workers.dev/mcp?mode=catalog`。

## 路线图

- [x] 目录模式（`search_api` + `call_api`）— v0.2
- [ ] 运行时从 URL 加载 OpenAPI
- [x] 一键部署到 Cloudflare — v0.2
- [ ] 基于 CSS 选择器的网页抓取连接器（HTMLRewriter）
- [ ] 按工具限流与 KV 缓存
- [ ] 需要登录账号的 OAuth 连接器
- [ ] 连接器共享市场
- [ ] 基于 Durable Objects 的 AI 互聊房间（A2A）

## 合规使用

只接入你有权使用的网站和 API，遵守各服务的条款、robots 规则与频率限制，密钥放在 Worker Secrets 中。

## 许可证

[MIT](LICENSE)。觉得有用请点个 ⭐，让更多人看到。
