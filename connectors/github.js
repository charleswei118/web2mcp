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
      description: "Find public GitHub repositories matching a query. Use this when you don't know the exact repo; use github_repo when you already have owner and name. Supports GitHub qualifiers like 'mcp language:rust stars:>100'. Returns up to `limit` repos (full_name, description, stars, language, url, updated_at). Unauthenticated calls share a low rate limit.",
      path: "/search/repositories",
      query: { q: "{query}", sort: "{sort}", per_page: "{limit}" },
      params: {
        query: { type: "string", required: true, description: "Search text with optional GitHub qualifiers, e.g. 'mcp server language:typescript'" },
        sort: { type: "string", enum: ["stars", "updated", "forks"], default: "stars", description: "Sort order: most stars, most recently updated, or most forks" },
        limit: { type: "integer", minimum: 1, maximum: 30, default: 10, description: "Max repositories to return (1-30)" },
      },
      pick: "items",
      fields: ["full_name", "description", "stars=stargazers_count", "language", "url=html_url", "updated_at"],
    },
    {
      name: "repo",
      description: "Get metadata for one public repository you already know by owner and name: description, stars, forks, language, license, topics, url and last push time. Use github_search_repos first if you only have keywords. Returns an error if the repo does not exist or is private.",
      path: "/repos/{owner}/{repo}",
      params: {
        owner: { type: "string", required: true, description: "User or organization that owns the repo, e.g. 'cloudflare'" },
        repo: { type: "string", required: true, description: "Repository name only, without the owner, e.g. 'workers-sdk'" },
      },
      fields: ["full_name", "description", "stars=stargazers_count", "forks=forks_count", "language", "license=license.spdx_id", "topics", "url=html_url", "pushed_at"],
    },
  ],
};
