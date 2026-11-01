export default {
  name: "reader",
  title: "Web reader",
  description: "Read any public web page as clean Markdown (via the Jina Reader service). Respect each site's terms.",
  baseUrl: "https://r.jina.ai",
  headers: { accept: "text/plain", "x-return-format": "markdown" },
  tools: [
    {
      name: "read",
      description: "Fetch any public web page and return its main content as Markdown, with navigation and ads stripped. Use it as a fallback for sites without a dedicated tool (prefer wikipedia_summary, github_repo etc. when they fit). Pages behind logins or paywalls may come back empty; long pages are truncated.",
      path: "/{url}",
      params: { url: { type: "string", description: "Full URL starting with http(s)://", required: true, pattern: "^https?://" } },
    },
  ],
};
