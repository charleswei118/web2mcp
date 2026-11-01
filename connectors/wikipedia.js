export default {
  name: "wikipedia",
  title: "Wikipedia",
  description: "Search Wikipedia and read article summaries (English).",
  baseUrl: "https://en.wikipedia.org",
  tools: [
    {
      name: "search",
      description: "Full-text search of English Wikipedia. Use this to find the right article title, then call wikipedia_summary with it. Returns titles, short descriptions and excerpts, best match first.",
      path: "/w/rest.php/v1/search/page",
      query: { q: "{query}", limit: "{limit}" },
      params: {
        query: { type: "string", description: "What to search for", required: true },
        limit: { type: "integer", description: "Max results (1-20)", minimum: 1, maximum: 20, default: 5 },
      },
      pick: "pages",
      fields: ["title", "description", "excerpt"],
    },
    {
      name: "summary",
      description: "Get the lead summary of an English Wikipedia article by its exact title (redirects are followed). If you are unsure of the title, use wikipedia_search first. Returns title, short description, the lead extract and the article url.",
      path: "/api/rest_v1/page/summary/{title}",
      params: { title: { type: "string", description: "Exact article title, e.g. 'Cloudflare'", required: true } },
      fields: ["title", "description", "extract", "url=content_urls.desktop.page"],
    },
  ],
};
