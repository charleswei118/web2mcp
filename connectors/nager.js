export default {
  name: "holidays",
  title: "Public holidays",
  description: "Public holidays for 100+ countries by year, from Nager.Date.",
  baseUrl: "https://date.nager.at",
  tools: [
    {
      name: "list",
      description: "List the public holidays of one country for one year, e.g. to tell whether a date is a day off or plan around a holiday. Returns entries of date (YYYY-MM-DD), name (English) and localName (in the country's language). Weekends are not listed. Returns an error for a country Nager.Date does not cover; for mainland China make-up workdays (调休) use holidaycn_year instead.",
      path: "/api/v3/PublicHolidays/{year}/{country}",
      params: {
        year: { type: "integer", description: "Four-digit year, e.g. 2026", required: true, minimum: 1975, maximum: 2075 },
        country: { type: "string", description: "Two-letter ISO 3166-1 country code in capitals, e.g. 'US', 'DE', 'TR'", required: true, pattern: "^[A-Z]{2}$" },
      },
      response: "json",
      fields: ["date", "name", "localName"],
    },
  ],
};
