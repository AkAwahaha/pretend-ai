import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDigest, collectRawItems, dedupe, selectItems, writeDigest } from "./generate.js";
import { fallbackCard, getLlmConfig, summarizeItem } from "./llm.js";

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

await loadEnv(path.join(here, "..", ".env"));

const args = process.argv.slice(2);
const fetchOnly = args.includes("--fetch-only");
const maxItems = Number(process.env.MAX_ITEMS || 8);
const featuredCount = Number(process.env.FEATURED_COUNT || 3);
const date = process.env.DIGEST_DATE || new Intl.DateTimeFormat("sv-SE", { timeZone: process.env.TZ || "Asia/Shanghai" }).format(new Date());
const outDir = path.resolve(here, "../../web/public/data");

console.log("开始抓取信息源，日期 " + date);
const raw = await collectRawItems();
const selected = selectItems(dedupe(raw), { featuredCount, maxItems });
console.log("去重后 " + raw.length + " 条，选中 " + selected.length + " 条");

if (fetchOnly) {
  console.log(
    JSON.stringify(
      selected.map((item) => ({ source: item.sourceLabel, category: item.category, title: item.title, url: item.url })),
      null,
      2,
    ),
  );
  process.exit(0);
}

const config = getLlmConfig();
const cards = [];

for (const item of selected) {
  try {
    if (!config.configured) {
      throw new Error("未配置 LLM_API_KEY");
    }
    const card = await summarizeItem(item, { config });
    cards.push(card);
    console.log("已生成：" + card.title);
  } catch (error) {
    console.warn("降级处理 " + item.title + "：" + error.message);
    cards.push(fallbackCard(item));
  }
}

const digest = buildDigest({ date, selected, cards });
await writeDigest(digest, { outDir });
console.log("已写入 " + outDir + "，共 " + digest.items.length + " 条");