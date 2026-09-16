import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { buildDigest, dedupe, scoreItems, selectItems, writeDigest } from "../src/generate.js";

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

describe("scoreItems", () => {
  it("平台数据与靠前排位会提高热度分", () => {
    const now = Date.now();
    const items = [
      {
        sourceKey: "hackernews",
        sourceLabel: "Hacker News",
        title: "OpenAI 发布新模型引发讨论",
        publishedAt: new Date(now).toISOString(),
        rank: 0,
        heat: 1500,
      },
      {
        sourceKey: "arxiv",
        sourceLabel: "arXiv",
        title: "蛋白质结构预测的一篇普通论文",
        publishedAt: "",
        rank: 4,
        heat: 0,
      },
    ];

    const scored = scoreItems(items, { now });

    assert.ok(scored[0].heat > scored[1].heat);
    assert.ok(scored[0].heat >= 0 && scored[0].heat <= 100);
  });

  it("多个来源报道同一话题时热度更高", () => {
    const now = Date.now();
    const base = { publishedAt: new Date(now).toISOString(), rank: 0, heat: 0 };
    const items = [
      { ...base, sourceKey: "techcrunch", sourceLabel: "TechCrunch", title: "OpenAI 收购 Glass Imaging" },
      { ...base, sourceKey: "theverge", sourceLabel: "The Verge", title: "OpenAI 收购 Glass Imaging 引发讨论" },
      { ...base, sourceKey: "arxiv", sourceLabel: "arXiv", title: "蛋白质结构预测的一篇普通论文" },
    ];

    const scored = scoreItems(items, { now });

    assert.ok(scored[0].heat > scored[2].heat);
  });

  it("空数组不会报错", () => {
    assert.deepEqual(scoreItems([]), []);
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