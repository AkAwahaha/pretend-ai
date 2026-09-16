import type { DailyDigest, DigestItem } from "../types";

const SITE_URL = "https://akawahaha.github.io/pretend-ai/";

function yamlValue(value: string): string {
  return JSON.stringify(String(value ?? ""));
}

function safeFileName(input: string, fallback = "item"): string {
  const cleaned = String(input ?? "")
    .replace(/[\\/:*?"<>|\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function dateFromItemId(id: string): string {
  const match = String(id ?? "").match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

export function itemFileName(item: DigestItem, date: string): string {
  return `${date}-${safeFileName(item.sourceLabel)}-${safeFileName(item.title)}.md`;
}

export function digestFileName(digest: DailyDigest): string {
  return `${digest.date}-假装懂AI日报.md`;
}

export function itemToMarkdown(item: DigestItem, date: string): string {
  const tags = ["AI日报", item.category].filter(Boolean);

  return [
    "---",
    `date: ${yamlValue(date)}`,
    `source: ${yamlValue(item.sourceLabel)}`,
    `topic: ${yamlValue(item.category)}`,
    `heat: ${Number(item.heat ?? 0)}`,
    `readTime: ${yamlValue(item.readTime)}`,
    `url: ${yamlValue(item.sourceUrl)}`,
    "tags:",
    ...tags.map((tag) => `  - ${tag}`),
    "---",
    "",
    `# ${item.title}`,
    "",
    `> ${item.summary}`,
    "",
    "## 这是什么",
    "",
    item.what,
    "",
    "## 核心亮点 · 实现思路",
    "",
    item.highlights,
    "",
    "## 产品视角",
    "",
    item.productView,
    "",
    `[阅读原文](${item.sourceUrl})`,
    "",
    "---",
    `来源：假装懂 AI · ${SITE_URL}`,
    "",
  ].join("\n");
}

export function digestToMarkdown(digest: DailyDigest): string {
  const sections = digest.items.map((item, index) => {
    return [
      `## ${index + 1}. ${item.title}`,
      "",
      `**来源**：${item.sourceLabel} · **主题**：${item.category} · **热度**：${item.heat ?? 0} · ${item.readTime}`,
      "",
      `> ${item.summary}`,
      "",
      "### 这是什么",
      "",
      item.what,
      "",
      "### 核心亮点 · 实现思路",
      "",
      item.highlights,
      "",
      "### 产品视角",
      "",
      item.productView,
      "",
      `[阅读原文](${item.sourceUrl})`,
      "",
      "---",
      "",
    ].join("\n");
  });

  return [
    "---",
    `date: ${yamlValue(digest.date)}`,
    `type: ${yamlValue("ai-daily")}`,
    `count: ${digest.items.length}`,
    "tags:",
    "  - AI日报",
    "---",
    "",
    `# 今日 AI 日报 · ${digest.date}`,
    "",
    `共 ${digest.items.length} 条内容，按热度排序。`,
    "",
    ...sections,
    `来源：假装懂 AI · ${SITE_URL}`,
    "",
  ].join("\n");
}

export function downloadMarkdown(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}