export default {
  name: "shici",
  title: "Chinese classical poetry",
  description: "Random lines of classical Chinese poetry (古诗词) with title and author, from the free 今日诗词 API.",
  baseUrl: "https://v1.jinrishici.com",
  tools: [
    {
      name: "random",
      description: "Get one random famous line of classical Chinese poetry (诗/词/曲), optionally from a theme. Use it for a daily quote, a greeting card line or a writing prompt. Returns content (the line), origin (poem title), author and category (theme path such as 古诗文-抒情-感恩).",
      path: "/{theme}.json",
      params: {
        theme: {
          type: "string",
          description: "Theme: all (default), or a category path such as shuqing (抒情), siji (四季), shanshui (山水), tianqi (天气), renwu (人物), shenghuo (生活), jieri (节日), dongwu (动物), zhiwu (植物)",
          enum: ["all", "shuqing", "siji", "shanshui", "tianqi", "renwu", "shenghuo", "jieri", "dongwu", "zhiwu"],
          default: "all",
        },
      },
      response: "json",
      fields: ["content", "origin", "author", "category"],
    },
  ],
};
