export default {
  name: "hackernews",
  title: "Hacker News",
  description: "Hacker News front page and search (via the public Algolia API).",
  baseUrl: "https://hn.algolia.com",
  tools: [
    {
      name: "front_page",
      description: "Stories currently on the Hacker News front page.",
      path: "/api/v1/search",
      query: { tags: "front_page", hitsPerPage: "{limit}" },
      params: { limit: { type: "integer", description: "Max stories (1-30)", minimum: 1, maximum: 30, default: 10 } },
      pick: "hits",
      fields: ["title", "url", "points", "num_comments", "id=objectID"],
    },
    {
      name: "search",
      description: "Search Hacker News stories by keyword.",
      path: "/api/v1/search",
      query: { query: "{query}", tags: "story", hitsPerPage: "{limit}" },
      params: {
        query: { type: "string", description: "Keywords", required: true },
        limit: { type: "integer", description: "Max results (1-30)", minimum: 1, maximum: 30, default: 10 },
      },
      pick: "hits",
      fields: ["title", "url", "points", "num_comments", "created_at", "id=objectID"],
    },
  ],
};
