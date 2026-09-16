import { describe, expect, it } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { digestFileName, digestToMarkdown, itemFileName, itemToMarkdown, notesFileName, notesToMarkdown } from "./markdown";

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

  it("把关联新闻的灵感写入文章", () => {
    const markdown = itemToMarkdown(item, TODAY_DIGEST.date, [
      {
        content: "这是一条面试表达",
        createdAt: 1,
        updatedAt: 1770000000000,
      },
    ]);

    expect(markdown).toContain("## 我的灵感");
    expect(markdown).toContain("这是一条面试表达");
  });
  it("标题作为一级标题", () => {
    const markdown = itemToMarkdown(item, TODAY_DIGEST.date);
    expect(markdown).toContain(`# ${item.title}`);
  });
});

describe("notesToMarkdown", () => {
  it("汇总独立灵感和关联新闻", () => {
    const markdown = notesToMarkdown(
      [
        {
          content: "独立想法",
          createdAt: 1,
          updatedAt: 1770000000000,
        },
        {
          content: "关联判断",
          createdAt: 1,
          updatedAt: 1770000100000,
          link: {
            title: "一条 AI 新闻",
            sourceLabel: "OpenAI",
            sourceUrl: "https://example.com/item",
          },
        },
      ],
      "2026-09-16",
    );

    expect(markdown).toContain("count: 2");
    expect(markdown).toContain("独立想法");
    expect(markdown).toContain("[OpenAI · 一条 AI 新闻](https://example.com/item)");
    expect(notesFileName("2026-09-16")).toBe("2026-09-16-我的灵感.md");
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