export default {
  name: "holidaycn",
  title: "China public holidays",
  description: "Mainland China statutory holidays and make-up workdays (调休) from the State Council notices, via the open holiday-cn dataset.",
  baseUrl: "https://cdn.jsdelivr.net",
  tools: [
    {
      name: "year",
      description: "List every official holiday day off and every make-up workday (调休上班) in mainland China for one year, e.g. to tell whether a date is a working day or plan around 春节/国庆. Returns entries of name (Chinese holiday name), date (YYYY-MM-DD) and isOffDay (true = day off, false = make-up workday). Ordinary weekends are not listed; a date that is absent follows the normal Mon-Fri rule. Data usually appears in November for the next year.",
      path: "/gh/NateScarlet/holiday-cn@master/{year}.json",
      params: { year: { type: "integer", description: "Four-digit year, e.g. 2026 (data from 2007 on)", required: true, minimum: 2007, maximum: 2100 } },
      response: "json",
      pick: "days",
      fields: ["name", "date", "isOffDay"],
    },
  ],
};
