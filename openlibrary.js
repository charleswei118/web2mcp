export default {
  name: "openlibrary",
  title: "Open Library",
  description: "Search Open Library books by title or author (free, no API key).",
  baseUrl: "https://openlibrary.org",
  tools: [
    {
      name: "search",
      description: "Search books by title or author. Returns a work path, authors, and first publication year.",
      path: "/search.json",
      query: {
        q: "{query}",
        limit: "{limit}",
        fields: "key,title,author_name,first_publish_year",
      },
      params: {
        query: { type: "string", description: "Book title or author name", required: true },
        limit: { type: "integer", description: "Maximum results (1-20)", minimum: 1, maximum: 20, default: 5 },
      },
      pick: "docs",
      fields: ["title", "authors=author_name", "first_publish_year", "url=key"],
    },
  ],
};
