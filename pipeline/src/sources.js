import { fetchText } from "./http.js";
import { extractLinks, parseFeed } from "./rss.js";

export const SOURCES = [
  {
    key: "openai",
    label: "OpenAI",
    category: "一手官方",
    type: "rss",
    url: "https://openai.com/news/rss.xml",
    limit: 4,
  },
  {
    key: "deepmind",
    label: "DeepMind",
    category: "前沿论文",
    type: "rss",
    url: "https://deepmind.google/blog/rss.xml",
    limit: 3,
  },
  {
    key: "tldr",
    label: "TLDR AI",
    category: "省时日报",
    type: "rss",
    url: "https://tldr.tech/api/rss/ai",
    limit: 4,
  },
  {
    key: "menlo",
    label: "Menlo Ventures",
    category: "商业视角",
    type: "rss",
    url: "https://menlovc.com/feed/",
    limit: 3,
  },
  {
    key: "github",
    label: "GitHub",
    category: "项目发现",
    type: "github",
    topic: "llm",
    minStars: 500,
    limit: 4,
  },
  {
    key: "anthropic",
    label: "Anthropic",
    category: "一手官方",
    type: "html",
    url: "https://www.anthropic.com/news",
    linkPattern: "/news/",
    limit: 3,
    optional: true,
  },
  {
    key: "huggingface",
    label: "Hugging Face",
    category: "前沿论文",
    type: "hf",
    url: "https://huggingface.co/api/daily_papers",
    limit: 3,
    optional: true,
  },
  {
    key: "arxiv",
    label: "arXiv",
    category: "前沿论文",
    type: "arxiv",
    url: "https://export.arxiv.org/api/query?search_query=cat:cs.CL&sortBy=submittedDate&sortOrder=descending&max_results=3",
    limit: 3,
    optional: true,
  },
];

function toRaw(source, entry) {
  return {
    sourceKey: source.key,
    sourceLabel: source.label,
    category: source.category,
    title: entry.title,
    url: entry.url,
    content: entry.summary || entry.title,
    publishedAt: entry.publishedAt || "",
  };
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export async function fetchSource(source, { fetchTextImpl = fetchText } = {}) {
  if (source.type === "rss") {
    const xml = await fetchTextImpl(source.url, {
      headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    });
    return parseFeed(xml)
      .slice(0, source.limit)
      .map((entry) => toRaw(source, entry));
  }

  if (source.type === "arxiv") {
    const xml = await fetchTextImpl(source.url, {
      headers: { accept: "application/atom+xml, application/xml" },
    });
    return parseFeed(xml)
      .slice(0, source.limit)
      .map((entry) => toRaw(source, entry));
  }

  if (source.type === "github") {
    const query = "topic:" + source.topic + " stars:>" + source.minStars + " pushed:>" + daysAgoIso(30);
    const url =
      "https://api.github.com/search/repositories?q=" +
      encodeURIComponent(query) +
      "&sort=stars&order=desc&per_page=" +
      source.limit;
    const payload = JSON.parse(await fetchTextImpl(url, { headers: { accept: "application/vnd.github+json" } }));
    return (payload.items ?? []).map((repo) =>
      toRaw(source, {
        title: repo.full_name,
        url: repo.html_url,
        summary: [
          repo.description,
          repo.language ? "语言：" + repo.language : "",
          "Stars：" + repo.stargazers_count,
        ]
          .filter(Boolean)
          .join(" · "),
        publishedAt: repo.pushed_at ?? "",
      }),
    );
  }

  if (source.type === "hf") {
    const payload = JSON.parse(await fetchTextImpl(source.url, { headers: { accept: "application/json" } }));
    const list = Array.isArray(payload) ? payload : payload.papers ?? [];
    return list
      .slice(0, source.limit)
      .map((entry) => {
        const paper = entry.paper ?? entry;
        return toRaw(source, {
          title: paper.title ?? "",
          url: paper.url ?? (paper.id ? "https://huggingface.co/papers/" + paper.id : source.url),
          summary: paper.summary ?? "",
          publishedAt: paper.publishedAt ?? entry.publishedAt ?? "",
        });
      })
      .filter((item) => item.title);
  }

  if (source.type === "html") {
    const html = await fetchTextImpl(source.url, { headers: { accept: "text/html" } });
    return extractLinks(html, source.url, source.linkPattern, source.limit).map((entry) =>
      toRaw(source, { ...entry, title: entry.title.slice(0, 60), summary: entry.title }),
    );
  }

  throw new Error("未知来源类型：" + source.type);
}