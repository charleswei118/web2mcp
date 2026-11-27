export default {
  name: "wikidata",
  title: "Wikidata",
  description: "Search Wikidata entities to ground names to stable IDs.",
  baseUrl: "https://www.wikidata.org",
  tools: [
    {
      name: "search",
      description: "Search Wikidata items by name or alias and get their stable IDs (e.g. 'Ada Lovelace' → Q7259), e.g. to tell apart people, places or things that share a name. Returns id, label and a short description, best match first; the item page is https://www.wikidata.org/wiki/{id}.",
      path: "/w/api.php",
      query: { action: "wbsearchentities", search: "{query}", language: "{language}", uselang: "{language}", format: "json", limit: "{limit}" },
      params: {
        query: { type: "string", description: "Name or alias to look up, e.g. 'Ada Lovelace'", required: true },
        language: { type: "string", description: "Language code to search and label in, e.g. 'en', 'de', 'zh'", pattern: "^[a-z]{2,3}(-[a-z]+)?$", default: "en" },
        limit: { type: "integer", description: "Max results (1-50)", minimum: 1, maximum: 50, default: 5 },
      },
      response: "json",
      pick: "search",
      fields: ["id", "label", "description"],
    },
  ],
};
