import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { itemKey, loadSeen, saveSeen, splitFresh } from "../src/seen.js";

describe("itemKey", () => {
  it("优先使用 URL 并做规范化", () => {
    assert.equal(itemKey({ url: "https://Example.com/A", title: "x" }), "https://example.com/a");
  });

  it("没有 URL 时退化为规范化标题", () => {
    assert.equal(itemKey({ title: "  Hello   World " }), "hello world");
  });
});

describe("splitFresh", () => {
  it("按已见索引拆分新旧内容", () => {
    const seen = new Map([["https://a.com", "2026-09-12"]]);
    const { fresh, stale } = splitFresh(
      [
        { url: "https://a.com", title: "A" },
        { url: "https://b.com", title: "B" },
      ],
      seen,
    );
    assert.equal(fresh.length, 1);
    assert.equal(stale.length, 1);
    assert.equal(fresh[0].url, "https://b.com");
  });
});

describe("saveSeen 与 loadSeen", () => {
  it("能持久化并读回索引", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "pretend-ai-seen-"));
    await saveSeen(dir, new Map([["https://a.com", "2026-09-13"]]));
    const loaded = await loadSeen(dir);
    assert.equal(loaded.get("https://a.com"), "2026-09-13");
  });

  it("索引不存在时返回空 Map", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "pretend-ai-empty-"));
    const loaded = await loadSeen(dir);
    assert.equal(loaded.size, 0);
  });
});