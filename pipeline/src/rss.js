import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function asArray(value) {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function text(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "object") {
    return text(value["#text"] ?? value.__cdata ?? "");
  }
  return "";
}

export function stripHtml(input) {
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickLink(entry) {
  const link = entry.link;
  if (!link) {
    return "";
  }
  if (typeof link === "string") {
    return link;
  }
  if (Array.isArray(link)) {
    const alternate = link.find((candidate) => (candidate?.["@_rel"] ?? "alternate") === "alternate") ?? link[0];
    return alternate?.["@_href"] ?? text(alternate);
  }
  return link["@_href"] ?? text(link);
}

function pickImage(entry) {
  const candidates = [];

  for (const item of asArray(entry.enclosure)) {
    const url = item?.["@_url"];
    const type = String(item?.["@_type"] ?? "");
    if (url && (type.startsWith("image") || type.length === 0)) {
      candidates.push(url);
    }
  }

  for (const item of asArray(entry.link)) {
    const url = item?.["@_href"];
    const rel = String(item?.["@_rel"] ?? "");
    const type = String(item?.["@_type"] ?? "");
    if (url && (rel === "enclosure" || type.startsWith("image"))) {
      candidates.push(url);
    }
  }

  for (const key of ["media:content", "media:thumbnail"]) {
    for (const item of asArray(entry[key])) {
      const url = item?.["@_url"];
      if (url) {
        candidates.push(url);
      }
    }
  }

  const html = [entry.description, entry.summary, entry.content, entry["content:encoded"]]
    .map((value) => text(value))
    .join(" ");
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) {
    candidates.push(match[1]);
  }

  return candidates.find((url) => typeof url === "string" && /^https?:\/\//.test(url)) ?? "";
}

export function parseFeed(xml) {
  const document = parser.parse(xml);
  const rssItems = asArray(document?.rss?.channel?.item);
  const atomEntries = asArray(document?.feed?.entry);
  const entries = rssItems.length > 0 ? rssItems : atomEntries;

  return entries
    .map((entry) => ({
      title: stripHtml(text(entry.title)),
      url: pickLink(entry),
      summary: stripHtml(text(entry.description ?? entry.summary ?? entry.content ?? "")),
      publishedAt: text(entry.pubDate ?? entry.updated ?? entry.published ?? ""),
      image: pickImage(entry),
    }))
    .filter((entry) => entry.title.length > 0 && entry.url.length > 0);
}

export function extractLinks(html, baseUrl, pattern, limit) {
  const matcher = new RegExp(pattern);
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  const seen = new Set();
  let match;

  while ((match = anchorPattern.exec(html)) !== null && results.length < limit) {
    const href = match[1];
    const title = stripHtml(match[2]);
    if (!matcher.test(href) || title.length < 8) {
      continue;
    }
    const url = new URL(href, baseUrl).toString();
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    results.push({ title, url, summary: "", publishedAt: "" });
  }

  return results;
}