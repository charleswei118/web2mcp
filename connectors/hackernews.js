export default {
  name: "hackernews",
  title: "Hacker News",
  description: "Hacker News front page and search (via the public Algolia API).",
  baseUrl: "https://hn.algolia.com",
  tools: [
    {
      name: "front_page",
      description: "List the stories currently on the Hacker News front page, ranked as on the site. Use this to see what is trending now; use hackernews_search to find stories on a topic. Returns title, url, points, comment count and story id.",
      path: "/api/v1/search",
      query: { tags: "front_page", hitsPerPage: "{limit}" },
      params: { limit: { type: "integer", description: "Max stories (1-30)", minimum: 1, maximum: 30, default: 10 } },
      pick: "hits",
      fields: ["title", "url", "points", "num_comments", "id=objectID"],
    },
    {
      name: "search",
      description: "Full-text search of Hacker News stories (not comments) by keyword, ranked by relevance. Use this to find discussions about a product, project or topic; use hackernews_front_page for what is trending now. Returns title, url, points, comment count, date and story id.",
      path: "/api/v1/search",
      query: { query: "{query}", tags: "story", hitsPerPage: "{limit}" },
      params: {
        query: { type: "string", description: "Keywords to match in story titles and text, e.g. 'model context protocol'", required: true },
        limit: { type: "integer", description: "Max results (1-30)", minimum: 1, maximum: 30, default: 10 },
      },
      pick: "hits",
      fields: ["title", "url", "points", "num_comments", "created_at", "id=objectID"],
    },
  ],
};
