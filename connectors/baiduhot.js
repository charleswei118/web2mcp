export default {
  name: "baiduhot",
  title: "Baidu hot search",
  description: "Baidu's real-time hot search list (百度热搜), the main trending-topics board for Chinese-language web search.",
  baseUrl: "https://top.baidu.com",
  tools: [
    {
      name: "realtime",
      description: "Get the current Baidu real-time hot search ranking (百度热搜榜): what Chinese internet users are searching for right now. Use it for Chinese news and trending topics; use hackernews_front_page for English tech news. Returns up to 50 entries of word (topic in Chinese), index (rank; the pinned item has none) and url (Baidu search link).",
      path: "/api/board",
      query: { platform: "wise", tab: "realtime" },
      params: {},
      response: "json",
      pick: "data.cards.0.content.0.content",
      fields: ["word", "index", "url"],
    },
  ],
};
