export default {
  name: "geocode",
  title: "Open-Meteo Geocoding",
  description: "Find latitude/longitude for a place name (free, no key).",
  baseUrl: "https://geocoding-api.open-meteo.com",
  tools: [
    {
      name: "search",
      description: "Turn a city or place name into coordinates. Use this before weather_forecast, which needs latitude/longitude. A name can match several places, so up to `limit` candidates are returned, best match first, each with name, country, region, latitude, longitude and timezone.",
      path: "/v1/search",
      query: { name: "{name}", count: "{limit}", language: "{language}" },
      params: {
        name: { type: "string", description: "Place name, e.g. 'Shanghai'", required: true },
        limit: { type: "integer", minimum: 1, maximum: 10, default: 3, description: "Max candidate places to return (1-10)" },
        language: { type: "string", description: "Result language, e.g. en, zh", default: "en" },
      },
      pick: "results",
      fields: ["name", "country", "admin1", "latitude", "longitude", "timezone"],
    },
  ],
};
