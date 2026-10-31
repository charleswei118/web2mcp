export default {
  name: "reader",
  title: "Web reader",
  description: "Read any public web page as clean Markdown (via the Jina Reader service). Respect each site's terms.",
  baseUrl: "https://r.jina.ai",
  headers: { accept: "text/plain", "x-return-format": "markdown" },
  tools: [
    {
      name: "read",
      description: "Fetch a web page and return its main content as Markdown.",
      path: "/{url}",
      params: { url: { type: "string", description: "Full URL starting with http(s)://", required: true, pattern: "^https?://" } },
    },
  ],
};
