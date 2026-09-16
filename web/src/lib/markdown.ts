import type { DailyDigest, DigestItem } from "../types";

const SITE_URL = "https://akawahaha.github.io/pretend-ai/";

export interface MarkdownNote {
  content: string;
  createdAt: number;
  updatedAt: number;
  link?: {
    title: string;
    sourceLabel: string;
    sourceUrl: string;
  };
}

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

function formatTimestamp(value: number): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes())].join(":");
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

export function notesFileName(date: string): string {
  return `${date}-我的灵感.md`;
}

export function itemToMarkdown(item: DigestItem, date: string, notes: MarkdownNote[] = []): string {
  const tags = ["AI日报", item.category].filter(Boolean);
  const noteSection = notes.length > 0
    ? [
        "## 我的灵感",
        "",
        ...notes.flatMap((note) => [
          `### ${formatTimestamp(note.updatedAt)}`,
          "",
          note.content,
          "",
        ]),
      ]
    : [];

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
    ...noteSection,
    `[阅读原文](${item.sourceUrl})`,
    "",
    "---",
    `来源：假装懂 AI · ${SITE_URL}`,
    "",
  ].join("\n");
}

export function notesToMarkdown(notes: MarkdownNote[], date: string): string {
  const sections = notes.map((note) => {
    const link = note.link && note.link.sourceUrl
      ? `[${note.link.sourceLabel} · ${note.link.title}](${note.link.sourceUrl})`
      : "独立笔记";

    return [
      `## ${formatTimestamp(note.updatedAt)}`,
      "",
      note.content,
      "",
      `关联：${link}`,
      "",
      "---",
      "",
    ].join("\n");
  });

  return [
    "---",
    `date: ${yamlValue(date)}`,
    `count: ${notes.length}`,
    "type: \"我的灵感\"",
    "tags:",
    "  - 我的灵感",
    "---",
    "",
    `# 我的灵感 · ${date}`,
    "",
    `共 ${notes.length} 条记录。`,
    "",
    ...sections,
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
    ...(digest.mainline ? [`> 今日主线：${digest.mainline}`, ""] : []),
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
