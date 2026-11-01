import test from "node:test";
import assert from "node:assert/strict";
import { buildRequest } from "../src/executor.js";
import holidaycn from "../connectors/holidaycn.js";
import baiduhot from "../connectors/baiduhot.js";
import shici from "../connectors/shici.js";
import bilibili from "../connectors/bilibili.js";

test("holidaycn builds the yearly dataset URL", () => {
  const r = buildRequest(holidaycn, holidaycn.tools[0], { year: 2026 });
  assert.equal(r.url, "https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/2026.json");
  assert.throws(() => buildRequest(holidaycn, holidaycn.tools[0], { year: 1999 }));
});
test("baiduhot targets the realtime board", () => {
  const r = buildRequest(baiduhot, baiduhot.tools[0], {});
  assert.match(r.url, /top\.baidu\.com\/api\/board\?platform=wise&tab=realtime/);
});
test("shici defaults to all and rejects unknown themes", () => {
  assert.equal(buildRequest(shici, shici.tools[0], {}).url, "https://v1.jinrishici.com/all.json");
  assert.throws(() => buildRequest(shici, shici.tools[0], { theme: "x" }));
});
test("bilibili popular passes limit and browser headers", () => {
  const r = buildRequest(bilibili, bilibili.tools[0], { limit: 5 });
  assert.match(r.url, /ps=5/);
  assert.equal(r.headers.referer, "https://www.bilibili.com/");
});
