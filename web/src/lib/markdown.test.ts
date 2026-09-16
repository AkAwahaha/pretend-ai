import { describe, expect, it } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { digestFileName, digestToMarkdown, itemFileName, itemToMarkdown } from "./markdown";

const item = TODAY_DIGEST.items[0];

describe("itemToMarkdown", () => {
  it("包含 frontmatter、标签与三段结构", () => {
    const markdown = itemToMarkdown(item, TODAY_DIGEST.date);

    expect(markdown.startsWith("---\n")).toBe(true);
    expect(markdown).toContain(`source: "${item.sourceLabel}"`);
    expect(markdown).toContain(`topic: "${item.category}"`);
    expect(markdown).toContain("tags:");
    expect(markdown).toContain("## 这是什么");
    expect(markdown).toContain("## 核心亮点 · 实现思路");
    expect(markdown).toContain("## 产品视角");
    expect(markdown).toContain(`[阅读原文](${item.sourceUrl})`);
  });

  it("标题作为一级标题", () => {
    const markdown = itemToMarkdown(item, TODAY_DIGEST.date);
    expect(markdown).toContain(`# ${item.title}`);
  });
});

describe("digestToMarkdown", () => {
  it("导出当天全部条目", () => {
    const markdown = digestToMarkdown(TODAY_DIGEST);
    expect(markdown).toContain(`count: ${TODAY_DIGEST.items.length}`);
    for (const entry of TODAY_DIGEST.items) {
      expect(markdown).toContain(entry.title);
    }
  });
});

describe("文件名", () => {
  it("去掉非法字符", () => {
    const name = itemFileName({ ...item, title: 'a/b:c*d?"e<f>g|h' }, "2026-09-16");
    expect(name).not.toMatch(/[\\/:*?"<>|]/);
    expect(name.endsWith(".md")).toBe(true);
  });

  it("日报文件名包含日期", () => {
    expect(digestFileName(TODAY_DIGEST)).toContain(TODAY_DIGEST.date);
  });
});