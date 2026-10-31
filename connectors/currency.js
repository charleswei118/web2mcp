export default {
  name: "currency",
  title: "Frankfurter exchange rates",
  description: "Foreign exchange reference rates published by the European Central Bank (free, no key).",
  baseUrl: "https://api.frankfurter.dev",
  tools: [
    {
      name: "latest",
      description: "Latest exchange rates from a base currency.",
      path: "/v1/latest",
      query: { base: "{base}", symbols: "{symbols}" },
      params: {
        base: { type: "string", description: "Base currency, e.g. USD", default: "USD" },
        symbols: { type: "string", description: "Comma-separated targets, e.g. CNY,EUR (optional)" },
      },
    },
  ],
};
