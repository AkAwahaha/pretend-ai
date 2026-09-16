import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SOURCES, fetchSource } from "./sources.js";

const CATEGORY_PRIORITY = ["一手官方", "国内动态", "行业新闻", "项目发现", "省时日报", "商业视角", "前沿论文"];

const SOURCE_WEIGHT = {
  一手官方: 1,
  行业新闻: 0.9,
  国内动态: 0.85,
  项目发现: 0.8,
  省时日报: 0.75,
  商业视角: 0.7,
  前沿论文: 0.6,
};

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
    return 0;
  }
  return Math.min(1, value / 800);
}

export function computeHeat(item, { now = Date.now() } = {}) {
  const aiHeat = Math.max(0, Math.min(100, Number(item.aiHeat ?? 0)));
  const weight = SOURCE_WEIGHT[item.category] ?? 0.7;
  const score =
    aiHeat * 0.55 +
    weight * 15 +
    rankScore(item.rank) * 10 +
    recencyScore(item.publishedAt, now) * 10 +
    platformScore(item.heat) * 10;
  return Math.round(Math.max(0, Math.min(100, score)));
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