import { fetchText } from "./http.js";

export function extractOgImage(html) {
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:image|og:image:url|twitter:image)["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|og:image:url|twitter:image)["']/i,
  ];
  for (const pattern of patterns) {
    const match = String(html ?? "").match(pattern);
    if (match?.[1] && /^https?:\/\//.test(match[1])) {
      return match[1];
    }
  }
  return "";
}

export async function enrichImages(items, { fetchTextImpl = fetchText, concurrency = 3, timeoutMs = 12000 } = {}) {
  const targets = items.filter((item) => !item.image && /^https?:\/\//.test(String(item.url ?? "")));
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const item = targets[cursor];
      cursor += 1;
      try {
        const html = await fetchTextImpl(item.url, { headers: { accept: "text/html" }, timeoutMs });
        const image = extractOgImage(html);
        if (image) {
          item.image = image;
        }
      } catch {
        // 抓不到就保持无图，前端会显示占位图
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, targets.length || 1)) }, () => worker()));
  return items;
}