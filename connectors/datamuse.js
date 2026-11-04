export default {
  name: "datamuse",
  title: "Datamuse",
  description: "Find words by meaning with the Datamuse word-finding API.",
  baseUrl: "https://api.datamuse.com",
  tools: [
    {
      name: "words",
      description: "Find English words whose meaning matches a word or a description, e.g. a synonym for 'happy' or the word for 'ringing in the ears' (tinnitus). Use this when you know what you mean but not the word. Returns word and score, best match first; scores only compare results within one call.",
      path: "/words",
      query: { ml: "{meaning}", max: "{limit}" },
      params: {
        meaning: { type: "string", description: "A word or a short description of the meaning, e.g. 'happy' or 'ringing in the ears'", required: true },
        limit: { type: "integer", description: "Max words (1-100)", minimum: 1, maximum: 100, default: 10 },
      },
      response: "json",
      fields: ["word", "score"],
    },
  ],
};
