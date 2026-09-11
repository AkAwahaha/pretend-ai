import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { SOURCES, fetchSource } from "./sources.js";

const CATEGORY_PRIORITY = ["一手官方", "项目发现", "省时日报", "商业视角", "前沿论文"];

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

export function rankItems(items) {
  return [...items].sort((a, b) => {
    const indexA = CATEGORY_PRIORITY.indexOf(a.category);
    const indexB = CATEGORY_PRIORITY.indexOf(b.category);
    const priorityA = indexA === -1 ? CATEGORY_PRIORITY.length : indexA;
    const priorityB = indexB === -1 ? CATEGORY_PRIORITY.length : indexB;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return String(b.publishedAt).localeCompare(String(a.publishedAt));
  });
}

export function selectItems(items, { featuredCount = 3, maxItems = 8 } = {}) {
  const ranked = rankItems(items);
  const featured = [];
  const usedSources = new Set();

  for (const item of ranked) {
    if (featured.length >= featuredCount) {
      break;
    }
    if (usedSources.has(item.sourceKey)) {
      continue;
    }
    usedSources.add(item.sourceKey);
    featured.push(item);
  }

  for (const item of ranked) {
    if (featured.length >= featuredCount) {
      break;
    }
    if (!featured.includes(item)) {
      featured.push(item);
    }
  }

  const counts = new Map();
  for (const item of featured) {
    counts.set(item.sourceKey, (counts.get(item.sourceKey) ?? 0) + 1);
  }

  const rest = [];
  const restLimit = Math.max(0, maxItems - featured.length);
  for (const item of ranked) {
    if (rest.length >= restLimit) {
      break;
    }
    if (featured.includes(item)) {
      continue;
    }
    const used = counts.get(item.sourceKey) ?? 0;
    if (used >= 2) {
      continue;
    }
    counts.set(item.sourceKey, used + 1);
    rest.push(item);
  }

  for (const item of ranked) {
    if (rest.length >= restLimit) {
      break;
    }
    if (featured.includes(item) || rest.includes(item)) {
      continue;
    }
    rest.push(item);
  }

  return [
    ...featured.map((item) => ({ ...item, featured: true })),
    ...rest.map((item) => ({ ...item, featured: false })),
  ];
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

  const next = [
    { date: digest.date, label: digest.label },
    ...index.filter((entry) => entry?.date !== digest.date),
  ].slice(0, 60);

  await writeJson(indexPath, next);
}