import { test } from "node:test";
import assert from "node:assert/strict";
import { xmlToJson, decodeEntities } from "../src/xml.js";
import { execute } from "../src/executor.js";
import { validateConnector } from "../src/registry.js";
import { pick } from "../src/template.js";

const ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<!-- comment -->
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <title type="html">ArXiv Query</title>
  <entry>
    <id>http://arxiv.org/abs/1</id>
    <title>Attention &amp; You</title>
    <summary><![CDATA[Uses <b>tags</b> & stuff]]></summary>
    <author><name>Ada</name></author>
    <author><name>Bob</name></author>
    <link href="http://arxiv.org/abs/1" rel="alternate"/>
    <arxiv:primary_category term="cs.CL"/>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/2</id>
    <title>Second &#x4E2D;&#25991;</title>
    <author><name>Cy</name></author>
  </entry>
</feed>`;

test("xmlToJson: elements, attributes, repeats, CDATA, entities, namespaces", () => {
  const j = xmlToJson(ATOM);
  assert.deepEqual(j.feed.title, { "@type": "html", "#text": "ArXiv Query" });
  assert.equal(j.feed.entry.length, 2);
  const e = j.feed.entry[0];
  assert.equal(e.title, "Attention & You");
  assert.equal(e.summary, "Uses <b>tags</b> & stuff");
  assert.deepEqual(e.author, [{ name: "Ada" }, { name: "Bob" }]);
  assert.deepEqual(e.link, { "@href": "http://arxiv.org/abs/1", "@rel": "alternate" });
  assert.deepEqual(e.primary_category, { "@term": "cs.CL" });
  assert.equal(j.feed.entry[1].title, "Second 中文");
});

test("xmlToJson: attribute values may contain > and quotes", () => {
  const j = xmlToJson(`<a x="1 > 0" y='say "hi"'/>`);
  assert.deepEqual(j.a, { "@x": "1 > 0", "@y": 'say "hi"' });
});

test("xmlToJson: DOCTYPE internal subset is skipped, entities not expanded", () => {
  const j = xmlToJson(`<!DOCTYPE r [<!ENTITY x "boom">]><r>&x;</r>`);
  assert.equal(j.r, "&x;");
});

test("xmlToJson: malformed input throws", () => {
  assert.throws(() => xmlToJson("<a><b></a>"), /Malformed/);
  assert.throws(() => xmlToJson("<a>"), /not closed/);
});

test("decodeEntities", () => {
  assert.equal(decodeEntities("&lt;&#65;&#x42;&unknown;"), "<AB&unknown;");
});

test("pick: * treats a lone value as a one-item list", () => {
  assert.deepEqual(pick({ a: { n: 1 } }, "a.*.n"), [1]);
  assert.deepEqual(pick({ a: [{ n: 1 }, { n: 2 }] }, "a.*.n"), [1, 2]);
});

const connector = {
  name: "arxiv",
  description: "arXiv",
  baseUrl: "https://export.arxiv.org",
  tools: [
    {
      name: "search",
      description: "Search arXiv",
      path: "/api/query",
      query: { search_query: "all:{query}" },
      params: { query: { type: "string", required: true } },
      response: "xml",
      pick: "feed.entry.*",
      fields: ["id", "title", "authors=author.*.name"],
    },
  ],
};

const fakeFetch = (body, ctype = "application/atom+xml") => async () =>
  new Response(body, { status: 200, headers: { "content-type": ctype } });

test("execute: response xml is parsed and shaped", async () => {
  const r = await execute(connector, connector.tools[0], { query: "x" }, {}, fakeFetch(ATOM));
  assert.equal(r.isError, false);
  assert.deepEqual(JSON.parse(r.text), [
    { id: "http://arxiv.org/abs/1", title: "Attention & You", authors: ["Ada", "Bob"] },
    { id: "http://arxiv.org/abs/2", title: "Second 中文", authors: ["Cy"] },
  ]);
});

test("execute: bad XML is a tool error", async () => {
  const r = await execute(connector, connector.tools[0], { query: "x" }, {}, fakeFetch("<feed><entry></feed>"));
  assert.equal(r.isError, true);
  assert.match(r.text, /Could not parse XML/);
});

test("execute: response text returns the body untouched", async () => {
  const tool = { ...connector.tools[0], response: "text", pick: undefined, fields: undefined };
  const r = await execute(connector, tool, { query: "x" }, {}, fakeFetch('{"a":1}', "application/json"));
  assert.equal(r.text, '{"a":1}');
});

test("validateConnector: rejects unknown response mode", () => {
  const bad = { ...connector, tools: [{ ...connector.tools[0], response: "yaml" }] };
  assert.ok(validateConnector(bad).some((e) => e.includes("response must be")));
  assert.deepEqual(validateConnector(connector), []);
});
