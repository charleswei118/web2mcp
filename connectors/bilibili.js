const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const FIELDS = ["title", "bvid", "author=owner.name", "category=tname", "views=stat.view", "likes=stat.like", "danmaku=stat.danmaku", "duration_s=duration"];

export default {
  name: "bilibili",
  title: "Bilibili",
  description: "Bilibili (哔哩哔哩) trending and ranked videos from its public web API. Bilibili blocks Cloudflare Workers IPs, so this connector works in stdio/self-hosted mode but not on a Workers deployment.",
  baseUrl: "https://api.bilibili.com",
  headers: { "user-agent": UA, referer: "https://www.bilibili.com/" },
  tools: [
    {
      name: "popular",
      description: "List videos currently trending on Bilibili's 综合热门 page, in site order. Use it to see what Chinese video audiences are watching now; use bilibili_ranking for the curated daily top-100 chart. Returns title, bvid (open as https://www.bilibili.com/video/<bvid>), author, category, views, likes, danmaku count and duration in seconds.",
      path: "/x/web-interface/popular",
      query: { ps: "{limit}", pn: 1 },
      params: { limit: { type: "integer", description: "Max videos (1-50)", minimum: 1, maximum: 50, default: 10 } },
      response: "json",
      pick: "data.list",
      fields: FIELDS,
    },
    {
      name: "ranking",
      description: "Get Bilibili's all-site ranking chart (排行榜, top 100 by recent quality and engagement, refreshed daily). Use it for the most popular videos over the last few days; use bilibili_popular for what is trending right now. Returns the top 20 with title, bvid, author, category, views, likes, danmaku count and duration in seconds.",
      path: "/x/web-interface/ranking/v2",
      query: { rid: 0, type: "all" },
      params: {},
      response: "json",
      pick: "data.list",
      fields: FIELDS,
      limit: 20,
    },
  ],
};
