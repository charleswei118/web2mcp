export default {
  name: "arxiv",
  title: "arXiv",
  description: "Search research papers on arXiv.",
  baseUrl: "https://export.arxiv.org",
  tools: [
    {
      name: "search",
      description: "Search arXiv papers by keyword. Returns title, authors, date, summary and link.",
      path: "/api/query",
      query: { search_query: "all:{query}", max_results: "{limit}" },
      params: {
        query: { type: "string", required: true, description: "Keywords, e.g. 'model context protocol'" },
        limit: { type: "integer", description: "Max results (1-20)", minimum: 1, maximum: 20, default: 5 },
      },
      response: "xml",
      pick: "feed.entry.*",
      fields: ["id", "title", "published", "authors=author.*.name", "summary"],
    },
  ],
};
