export default {
  name: "geocode",
  title: "Open-Meteo Geocoding",
  description: "Find latitude/longitude for a place name (free, no key).",
  baseUrl: "https://geocoding-api.open-meteo.com",
  tools: [
    {
      name: "search",
      description: "Look up a city or place and get its coordinates, country and timezone.",
      path: "/v1/search",
      query: { name: "{name}", count: "{limit}", language: "{language}" },
      params: {
        name: { type: "string", description: "Place name, e.g. 'Shanghai'", required: true },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 3 },
        language: { type: "string", description: "Result language, e.g. en, zh", default: "en" },
      },
      pick: "results",
      fields: ["name", "country", "admin1", "latitude", "longitude", "timezone"],
    },
  ],
};
