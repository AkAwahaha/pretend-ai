import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function itemKey(item) {
  const url = String(item.url || "").trim().toLowerCase();
  if (url) {
    return url;
  }
  return String(item.title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function loadSeen(dir) {
  try {
    const raw = await readFile(path.join(dir, "seen.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return new Map(Object.entries(parsed));
    }
    return new Map();
  } catch {
    return new Map();
  }
}

export async function saveSeen(dir, seen) {
  const entries = Array.from(seen.entries()).slice(-1000);
  await writeFile(path.join(dir, "seen.json"), JSON.stringify(Object.fromEntries(entries), null, 2), "utf8");
}

export function splitFresh(items, seen) {
  const fresh = [];
  const stale = [];
  for (const item of items) {
    if (seen.has(itemKey(item))) {
      stale.push(item);
    } else {
      fresh.push(item);
    }
  }
  return { fresh, stale };
}