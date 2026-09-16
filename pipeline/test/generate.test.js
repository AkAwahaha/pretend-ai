import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildDigest, computeHeat, dedupe, selectItems, writeDigest } from "../src/generate.js";

function sample(overrides = {}) {
  return {
    sourceKey: "openai",
    sourceLabel: "OpenAI",
    category: "一手官方",
    title: "Title",
    url: "https://example.com",
    content: "Content",
    publishedAt: "",
    ...overrides,
  };
}

describe("dedupe", () => {
  it("按标题去重", () => {
    const items = [sample({ title: "Same" }), sample({ title: " same " }), sample({ title: "Other" })];
    assert.equal(dedupe(items).length, 2);
  });
});

describe("selectItems", () => {
  it("精读优先不同来源，速览补齐", () => {
    const items = [
      sample({ sourceKey: "openai", title: "A" }),
      sample({ sourceKey: "openai", title: "B" }),
      sample({ sourceKey: "github", title: "C", category: "项目发现", sourceLabel: "GitHub" }),
      sample({ sourceKey: "tldr", title: "D", category: "省时日报", sourceLabel: "TLDR AI" }),
    ];
    const selected = selectItems(items, { featuredCount: 3, maxItems: 4 });
    assert.equal(selected.filter((item) => item.featured).length, 3);
    assert.equal(selected.length, 4);
    assert.equal(selected[0].title, "A");
  });
});

describe("buildDigest", () => {
  it("组装成前端数据结构", () => {
    const selected = [{ ...sample(), featured: true }];
    const cards = [
      { title: "T", summary: "S", what: "W", highlights: "H", productView: "P", readTime: "2 min" },
    ];
    const digest = buildDigest({ date: "2026-09-12", selected, cards });
    assert.equal(digest.label, "09.12");
    assert.equal(digest.items[0].title, "T");
    assert.equal(digest.items[0].featured, false);
    assert.equal(digest.items[0].heat, 0);
  });
});

describe("computeHeat", () => {
  it("平台热度与靠前排位会提高分数", () => {
    const now = Date.now();
    const cold = computeHeat({ category: "一手官方", rank: 4, publishedAt: "", heat: 0 }, { now });
    const hot = computeHeat(
      { category: "一手官方", rank: 0, publishedAt: new Date(now).toISOString(), heat: 800 },
      { now },
    );
    assert.ok(hot > cold);
    assert.ok(hot <= 100);
  });

  it("缺失字段时也能算出基础分", () => {
    const score = computeHeat({}, { now: Date.now() });
    assert.ok(score >= 0 && score <= 100);
  });
});

describe("writeDigest", () => {
  it("写入 latest、archive 与 index", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "pretend-ai-"));
    const digest = { date: "2026-09-12", label: "09.12", items: [] };
    await writeDigest(digest, { outDir: dir });
    const latest = JSON.parse(await readFile(path.join(dir, "latest.json"), "utf8"));
    const index = JSON.parse(await readFile(path.join(dir, "index.json"), "utf8"));
    assert.equal(latest.date, "2026-09-12");
    assert.equal(index[0].label, "09.12");
  });
});