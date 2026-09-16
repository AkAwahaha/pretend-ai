import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDigest, collectRawItems, dedupe, scoreItems, selectItems, writeDigest } from "./generate.js";
import { enrichImages } from "./images.js";
import { getLlmConfig, summarizeItem, summarizeMainline } from "./llm.js";
import { itemKey, loadSeen, saveSeen, splitFresh } from "./seen.js";

const here = path.dirname(fileURLToPath(import.meta.url));

async function loadEnv(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // 没有 .env 时走系统环境变量
  }
}

function buildPool({ fresh, stale, seen, poolLimit, seed }) {
  const staleSorted = [...stale].sort((a, b) =>
    String(seen.get(itemKey(a)) ?? "").localeCompare(String(seen.get(itemKey(b)) ?? "")),
  );
  const combined = [...fresh, ...staleSorted];
  return selectItems(combined, { featuredCount: 0, maxItems: poolLimit, seed });
}

async function pickCards(pool, { config, needed }) {
  const picked = [];
  let cursor = 0;
  const concurrency = Math.max(1, Math.min(config.concurrency ?? 3, pool.length || 1));

  async function worker() {
    while (true) {
      if (picked.length >= needed) {
        return;
      }
      const current = cursor;
      cursor += 1;
      if (current >= pool.length) {
        return;
      }
      const item = pool[current];
      try {
        const card = await summarizeItem(item, { config });
        if (picked.length >= needed) {
          return;
        }
        picked.push({ order: current, item, card });
        console.log("已生成：" + card.title);
      } catch (error) {
        console.warn("跳过：" + item.title + "（" + error.message + "）");
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return picked.sort((a, b) => a.order - b.order).slice(0, needed);
}

await loadEnv(path.join(here, "..", ".env"));

const args = process.argv.slice(2);
const fetchOnly = args.includes("--fetch-only");
const maxItems = Number(process.env.MAX_ITEMS || 8);
const date =
  process.env.DIGEST_DATE ||
  new Intl.DateTimeFormat("sv-SE", { timeZone: process.env.TZ || "Asia/Shanghai" }).format(new Date());
const outDir = path.resolve(here, "../../web/public/data");
const seenDir = path.resolve(here, "../data");

console.log("开始抓取信息源，日期 " + date);
const raw = await collectRawItems();
const deduped = dedupe(raw);
const seen = await loadSeen(seenDir);
const { fresh, stale } = splitFresh(deduped, seen);
const freshKeys = new Set(fresh.map((item) => itemKey(item)));
console.log(
  "去重后 " + deduped.length + " 条：新内容 " + fresh.length + " 条，历史重复 " + stale.length + " 条",
);

const pool = buildPool({ fresh, stale, seen, poolLimit: maxItems * 2, seed: date });
console.log("候选池 " + pool.length + " 条");

if (fetchOnly) {
  console.log(
    JSON.stringify(
      pool.map((item) => ({
        source: item.sourceLabel,
        category: item.category,
        fresh: freshKeys.has(itemKey(item)),
        title: item.title,
        url: item.url,
      })),
      null,
      2,
    ),
  );
  process.exit(0);
}

const config = getLlmConfig();
if (!config.configured) {
  console.error("未配置 LLM_API_KEY，已终止生成");
  process.exit(1);
}
console.log(
  "大模型配置：模型 " + config.model + "，并发 " + config.concurrency + "，单次超时 " + config.timeoutMs + "ms",
);

const picked = await pickCards(pool, { config, needed: maxItems });
if (picked.length < maxItems) {
  console.warn("只生成了 " + picked.length + " 条（目标 " + maxItems + " 条），其余候选生成失败");
}

const scoredItems = scoreItems(picked.map((entry) => entry.item));
const ordered = picked
  .map((entry, index) => ({ ...entry, scored: scoredItems[index] }))
  .sort((a, b) => b.scored.heat - a.scored.heat);

const selected = ordered.map((entry) => ({ ...entry.item, featured: false, heat: entry.scored.heat }));
const cards = ordered.map((entry) => entry.card);

await enrichImages(selected);
console.log("配图补齐：" + selected.filter((item) => item.image).length + "/" + selected.length + " 条带图");
let mainline = "";
try {
  mainline = await summarizeMainline(cards, { config });
  console.log("今日主线：" + mainline);
} catch (error) {
  console.warn("主线生成失败，已跳过：" + error.message);
}

const digest = buildDigest({ date, selected, cards, mainline });
await writeDigest(digest, { outDir });

for (const item of selected) {
  seen.set(itemKey(item), date);
}
await saveSeen(seenDir, seen);

console.log("已写入 " + outDir + "，共 " + digest.items.length + " 条");