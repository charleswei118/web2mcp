export default {
  name: "pypi",
  title: "PyPI",
  description: "Package metadata from the public Python Package Index.",
  baseUrl: "https://pypi.org",
  tools: [
    {
      name: "package",
      description: "Get the latest release version, summary, license, homepage, and Python requirement of a package.",
      path: "/pypi/{name}/json",
      params: {
        name: { type: "string", required: true, description: "Python package name, e.g. 'requests'" },
      },
      pick: "info",
      fields: ["name", "version", "summary", "license", "home_page", "requires_python"],
    },
  ],
};
