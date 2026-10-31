// Separate from npm.js because download counts live on a different host,
// and a connector may only call its own baseUrl.
export default {
  name: "npmstats",
  title: "npm stats",
  description: "Download counts for npm packages (via the public npm downloads API).",
  baseUrl: "https://api.npmjs.org",
  tools: [
    {
      name: "downloads",
      description: "Number of downloads of an npm package in the last 7 days.",
      path: "/downloads/point/last-week/{name}",
      params: {
        name: { type: "string", required: true, description: "Package name, e.g. 'express' or '@types/node'" },
      },
      fields: ["package", "downloads", "start", "end"],
    },
  ],
};
