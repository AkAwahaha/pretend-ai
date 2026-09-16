import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SOURCES, fetchSource } from "./sources.js";

const CATEGORY_PRIORITY = ["一手官方", "国内动态", "行业新闻", "项目发现", "省时日报", "商业视角", "前沿论文"];

const HOT_KEYWORDS = [
  "发布",
  "推出",
  "上线",
  "开放",
  "融资",
  "收购",
  "并购",
  "开源",
  "突破",
  "泄露",
  "监管",
  "法规",
  "备案",
  "禁用",
  "下架",
  "涨价",
  "降价",
  "合作",
  "芯片",
  "算力",
  "模型",
  "agent",
  "裁员",
  "离职",
  "诉讼",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "will",
  "has",
  "have",
  "new",
  "how",
  "why",
  "what",
  "its",
  "can",
  "you",
  "your",
  "their",
  "about",
  "after",
  "into",
  "over",
  "more",
  "than",
  "not",
  "but",
]);

function tokenize(text) {
  const tokens = new Set();
  const lower = String(text ?? "").toLowerCase();

  for (const word of lower.match(/[a-z][a-z0-9+#.-]{3,}/g) ?? []) {
    if (!STOP_WORDS.has(word)) {
      tokens.add(word);
    }
  }

  const chinese = lower.replace(/[^\u4e00-\u9fa5]+/g, " ");
  for (const segment of chinese.split(/\s+/)) {
    if (segment.length < 3) {
      continue;
    }
    for (let size = 3; size <= Math.min(4, segment.length); size += 1) {
      for (let index = 0; index + size <= segment.length; index += 1) {
        tokens.add(segment.slice(index, index + size));
      }
    }
  }

  return tokens;
}

function recencyScore(publishedAt, now) {
  const time = Date.parse(String(publishedAt ?? ""));
  if (Number.isNaN(time)) {
    return 0.4;
  }
  const hours = Math.max(0, (now - time) / 3600000);
  return Math.max(0, 1 - hours / 72);
}

function rankScore(rank) {
  return Math.max(0, 1 - Number(rank ?? 0) / 5);
}

function platformScore(heat) {
  const value = Number(heat ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return 0.5;
  }
  return Math.max(0.5, Math.min(1, value / 800));
}

function keywordScore(title) {
  const text = String(title ?? "").toLowerCase();
  const hits = HOT_KEYWORDS.filter((keyword) => text.includes(keyword)).length;
  return Math.min(1, hits / 3);
}

function crossSourceScore(items, tokensByItem, index) {
  const documentFrequency = new Map();
  for (const tokens of tokensByItem) {
    for (const token of tokens) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const maxFrequency = Math.max(2, Math.ceil(items.length * 0.4));

  const matchedSources = new Set();
  for (let other = 0; other < items.length; other += 1) {
    if (other === index) {
      continue;
    }
    const otherTokens = tokensByItem[other];
    for (const token of tokensByItem[index]) {
      const frequency = documentFrequency.get(token) ?? 0;
      if (frequency >= 2 && frequency <= maxFrequency && otherTokens.has(token)) {
        matchedSources.add(items[other].sourceKey);
        break;
      }
    }
  }

  return Math.min(1, matchedSources.size / 3);
}

export function scoreItems(items, { now = Date.now() } = {}) {
  const tokensByItem = items.map((item) =>
    tokenize(String(item.title ?? "") + " " + String(item.sourceLabel ?? "")),
  );

  return items.map((item, index) => {
    const score =
      crossSourceScore(items, tokensByItem, index) * 35 +
      platformScore(item.heat) * 25 +
      rankScore(item.rank) * 20 +
      recencyScore(item.publishedAt, now) * 10 +
      keywordScore(item.title) * 10;

    return { ...item, heat: Math.round(Math.max(0, Math.min(100, score))) };
  });
}

export function normalizeTitle(title) {
  return String(title).toLowerCase().replace(/\s+/g, " ").trim();
}

export function dedupe(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function rotationScore(value, seed) {
  const key = String(value) + "|" + String(seed);
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 1000003;
  }
  return hash;
}

export function rankItems(items, { seed = "" } = {}) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const indexA = CATEGORY_PRIORITY.indexOf(a.item.category);
      const indexB = CATEGORY_PRIORITY.indexOf(b.item.category);
      const priorityA = indexA === -1 ? CATEGORY_PRIORITY.length : indexA;
      const priorityB = indexB === -1 ? CATEGORY_PRIORITY.length : indexB;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const rotateA = rotationScore(a.item.sourceKey, seed);
      const rotateB = rotationScore(b.item.sourceKey, seed);
      if (rotateA !== rotateB) {
        return rotateA - rotateB;
      }
      // 保持调用方给定的优先顺序（新内容优先，其次最久未发布的历史内容）
      return a.index - b.index;
    })
    .map((entry) => entry.item);
}

export function selectItems(items, { featuredCount = 3, maxItems = 8, seed = "" } = {}) {
  const ranked = rankItems(items, { seed });
  const buckets = new Map();
  const categoryOf = new Map();

  for (const item of ranked) {
    const bucket = buckets.get(item.sourceKey) ?? [];
    bucket.push(item);
    buckets.set(item.sourceKey, bucket);
    if (!categoryOf.has(item.sourceKey)) {
      categoryOf.set(item.sourceKey, item.category);
    }
  }

  const ordered = [];
  let round = 0;

  while (ordered.length < maxItems) {
    const usedCategories = new Set();
    let added = false;

    for (const [sourceKey, bucket] of buckets) {
      if (ordered.length >= maxItems) {
        break;
      }
      if (round >= bucket.length) {
        continue;
      }
      const category = categoryOf.get(sourceKey);
      if (usedCategories.has(category)) {
        continue;
      }
      ordered.push(bucket[round]);
      usedCategories.add(category);
      added = true;
    }

    if (!added) {
      break;
    }
    round += 1;
  }

  return ordered.map((item, index) => ({ ...item, featured: index < featuredCount }));
}

export async function collectRawItems({ sources = SOURCES, fetchSourceImpl = fetchSource, logger = console } = {}) {
  const collected = [];
  for (const source of sources) {
    try {
      const items = await fetchSourceImpl(source);
      logger.log("[" + source.label + "] 抓到 " + items.length + " 条");
      collected.push(...items);
    } catch (error) {
      const message = "[" + source.label + "] 抓取失败：" + error.message;
      if (source.optional) {
        logger.warn(message);
      } else {
        logger.error(message);
      }
    }
  }
  return collected;
}

export function createItemId(item, date, index) {
  return item.sourceKey + "-" + date + "-" + index;
}

export function buildDigest({ date, selected, cards }) {
  return {
    date,
    label: date.slice(5).replace("-", "."),
    headline: "今日 AI 日报",
    kicker: "DAILY BRIEF",
    items: selected.map((item, index) => ({
      id: createItemId(item, date, index),
      source: item.sourceKey,
      sourceLabel: item.sourceLabel,
      category: cards[index].topic ?? item.category,
      sourceCategory: item.category,
      featured: false,
      heat: Number(item.heat ?? 0),
      sourceUrl: item.url,
      readTime: cards[index].readTime,
      title: cards[index].title,
      summary: cards[index].summary,
      what: cards[index].what,
      highlights: cards[index].highlights,
      productView: cards[index].productView,
    })),
  };
}

async function writeJson(filePath, value) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function writeDigest(digest, { outDir }) {
  await mkdir(path.join(outDir, "archive"), { recursive: true });
  await writeJson(path.join(outDir, "latest.json"), digest);
  await writeJson(path.join(outDir, "archive", digest.date + ".json"), digest);

  const indexPath = path.join(outDir, "index.json");
  let index = [];
  try {
    const parsed = JSON.parse(await readFile(indexPath, "utf8"));
    index = Array.isArray(parsed) ? parsed : [];
  } catch {
    index = [];
  }

  const entry = {
    date: digest.date,
    label: digest.label,
    count: digest.items.length,
    title: digest.items[0]?.title ?? "",
    sources: Array.from(new Set(digest.items.map((item) => item.sourceLabel))),
  };

  const next = [entry, ...index.filter((item) => item?.date !== digest.date)].slice(0, 90);

  await writeJson(indexPath, next);
}