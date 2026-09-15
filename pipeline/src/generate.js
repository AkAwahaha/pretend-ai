import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SOURCES, fetchSource } from "./sources.js";

const CATEGORY_PRIORITY = ["一手官方", "国内动态", "行业新闻", "项目发现", "省时日报", "商业视角", "前沿论文"];

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
  return [...items].sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a.category);
    const indexB = CATEGORY_PRIORITY.indexOf(b.category);
    const priorityA = indexA === -1 ? CATEGORY_PRIORITY.length : indexA;
    const priorityB = indexB === -1 ? CATEGORY_PRIORITY.length : indexB;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    const rotateA = rotationScore(a.sourceKey, seed);
    const rotateB = rotationScore(b.sourceKey, seed);
    if (rotateA !== rotateB) {
      return rotateA - rotateB;
    }
    return String(b.publishedAt).localeCompare(String(a.publishedAt));
  });
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
      category: item.category,
      featured: item.featured,
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