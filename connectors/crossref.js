export default {
  name: "crossref",
  title: "Crossref",
  description: "Search scholarly works and DOI metadata from the public Crossref API.",
  baseUrl: "https://api.crossref.org",
  tools: [
    {
      name: "search",
      description: "Search scholarly works by keyword. Returns DOI, title, authors, publication year and URL.",
      path: "/works",
      query: {
        query: "{query}",
        rows: "{limit}",
        select: "DOI,title,author,issued,URL",
      },
      params: {
        query: { type: "string", required: true, description: "Keywords to search for" },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 5, description: "Maximum results (1-20)" },
      },
      pick: "message.items",
      fields: ["doi=DOI", "title", "authors=author", "year=issued.date-parts.0.0", "url=URL"],
    },
  ],
};
