export default {
  name: "npm",
  title: "npm",
  description: "Package info from the public npm registry. Weekly downloads are in the npmstats connector.",
  baseUrl: "https://registry.npmjs.org",
  tools: [
    {
      name: "package",
      description: "Get the latest version, description, license and homepage of an npm package. For download counts use npmstats_downloads instead. Returns an error if the package does not exist.",
      path: "/{name}/latest",
      params: {
        name: { type: "string", required: true, description: "Package name, e.g. 'express' or '@types/node'" },
      },
      fields: ["name", "version", "description", "license", "homepage"],
    },
  ],
};
