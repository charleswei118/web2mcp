export default {
  name: "github",
  title: "GitHub",
  description: "Search public GitHub repositories and read repo details. Set the GITHUB_TOKEN secret for higher rate limits.",
  baseUrl: "https://api.github.com",
  headers: {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    authorization: "Bearer ${?GITHUB_TOKEN}", // optional: dropped when GITHUB_TOKEN is not set
  },
  tools: [
    {
      name: "search_repos",
      description: "Search repositories. Supports GitHub qualifiers like 'mcp language:rust stars:>100'.",
      path: "/search/repositories",
      query: { q: "{query}", sort: "{sort}", per_page: "{limit}" },
      params: {
        query: { type: "string", required: true },
        sort: { type: "string", enum: ["stars", "updated", "forks"], default: "stars" },
        limit: { type: "integer", minimum: 1, maximum: 30, default: 10 },
      },
      pick: "items",
      fields: ["full_name", "description", "stars=stargazers_count", "language", "url=html_url", "updated_at"],
    },
    {
      name: "repo",
      description: "Get details of one repository.",
      path: "/repos/{owner}/{repo}",
      params: {
        owner: { type: "string", required: true },
        repo: { type: "string", required: true },
      },
      fields: ["full_name", "description", "stars=stargazers_count", "forks=forks_count", "language", "license=license.spdx_id", "topics", "url=html_url", "pushed_at"],
    },
  ],
};
