import { postJson } from "./http.js";

export const TOPICS = [
  "模型技术快讯",
  "商业资本动态",
  "算力硬件上游",
  "行业应用落地",
  "政策监管治理",
  "开源开发者生态",
  "深度观点与趋势分析",
];

export function getLlmConfig(env = process.env) {
  const apiKey = env.LLM_API_KEY || env.OPENAI_API_KEY || "";
  const baseUrl = (env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = env.LLM_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(env.LLM_TIMEOUT_MS || 60000);
  const jsonMode = String(env.LLM_JSON_MODE || "true") !== "false";
  const concurrency = Math.max(1, Number(env.LLM_CONCURRENCY || 3));
  return { apiKey, baseUrl, model, timeoutMs, jsonMode, concurrency, configured: apiKey.length > 0 };
}

export function buildPrompt(item) {
  const system = [
    "你是 AI 产品经理的情报编辑。",
    "把一条 AI 资讯或开源项目，整理成可以直接用于面试准备的结构化卡片。",
    "要求：所有字段必须用简体中文输出；不堆砌形容词；说清楚它解决了什么问题、亮点和实现思路在哪、产品经理应该怎么理解。",
    "英文原文必须翻译成中文；只有公司名、产品名、模型名和开源仓库名可以保留英文，且必须放在中文语境里，不得出现整句英文。",
    "只输出 JSON，不要输出解释文字。JSON 结构：{title, summary, what, highlights, productView, readTime, topic, terms}。",
    "terms 是这条内容里非技术背景的人可能看不懂的术语，0-3 个，每个包含 term（术语原文）和 explain（一句话解释）。没有就返回空数组。",
    "topic 必须从以下分类里选最贴切的一个：模型技术快讯 / 商业资本动态 / 算力硬件上游 / 行业应用落地 / 政策监管治理 / 开源开发者生态 / 深度观点与趋势分析。",
    "title 用中文概括；开源项目保留 owner/repo，其余英文标题必须翻译。",
    "readTime 用「X 分钟」格式。",
    "summary 用 80-120 字完整说清这条内容；what 2-3 句；highlights 3-4 句，把实现思路讲透；productView 3-4 句，要落到产品判断或面试表达。",
  ].join("\n");

  const user = [
    "来源：" + item.sourceLabel + "（" + item.category + "）",
    "标题：" + item.title,
    "链接：" + item.url,
    "原始内容：" + String(item.content || item.title).slice(0, 2500),
  ].join("\n");

  return { system, user };
}

export function extractJson(text) {
  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型输出里没有 JSON 对象");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function normalizeReadTime(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/(\d+)\s*(?:min|minute|minutes|分钟)?/i);
  if (!match) {
    return "2 分钟";
  }
  return match[1] + " 分钟";
}

export function normalizeTerms(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry.term === "string" &&
        typeof entry.explain === "string" &&
        entry.term.trim().length > 0 &&
        entry.explain.trim().length > 0,
    )
    .map((entry) => ({ term: entry.term.trim(), explain: entry.explain.trim() }))
    .slice(0, 3);
}

export function normalizeTopic(value) {
  const text = String(value ?? "").trim();
  if (TOPICS.includes(text)) {
    return text;
  }
  const partial = TOPICS.find((topic) => text.includes(topic) || topic.includes(text));
  return partial ?? "模型技术快讯";
}

function hasUntranslatedEnglish(value) {
  return /[A-Za-z][A-Za-z0-9\s,.-]{29,}/.test(String(value));
}

export function validateCard(value) {
  const errors = [];
  const fields = ["title", "summary", "what", "highlights", "productView", "topic"];
  for (const field of fields) {
    if (typeof value?.[field] !== "string" || value[field].trim().length === 0) {
      errors.push("缺少字段：" + field);
    }
  }
  for (const field of fields) {
    if (typeof value?.[field] === "string" && hasUntranslatedEnglish(value[field])) {
      errors.push("疑似未翻译的英文：" + field);
    }
  }

  return { ok: errors.length === 0, errors };
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label + "超时（" + ms + "ms）")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function summarizeItem(item, { config, postJsonImpl = postJson, retries = 1 } = {}) {
  if (!config?.apiKey) {
    throw new Error("缺少 LLM_API_KEY，无法调用大模型");
  }

  const timeoutMs = config.timeoutMs ?? 60000;
  const { system, user } = buildPrompt(item);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const payload = {
        model: config.model,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      };
      if (config.jsonMode !== false) {
        payload.response_format = { type: "json_object" };
      }

      const response = await withTimeout(
        postJsonImpl(config.baseUrl + "/chat/completions", payload, {
          headers: { authorization: "Bearer " + config.apiKey },
          timeoutMs,
        }),
        timeoutMs,
        "大模型请求",
      );

      const content = response?.choices?.[0]?.message?.content ?? "";
      if (String(content).trim().length === 0) {
        throw new Error("模型返回内容为空");
      }

      const parsed = extractJson(content);
      const { ok, errors } = validateCard(parsed);
      if (!ok) {
        throw new Error(errors.join("；"));
      }

      return {
        title: parsed.title.trim(),
        summary: parsed.summary.trim(),
        what: parsed.what.trim(),
        highlights: parsed.highlights.trim(),
        productView: parsed.productView.trim(),
        readTime: normalizeReadTime(parsed.readTime),
        topic: normalizeTopic(parsed.topic),
        terms: normalizeTerms(parsed.terms),
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export function buildMainlinePrompt(cards) {
  const system = [
    "你是 AI 产品经理的情报编辑。",
    "下面是今天日报的全部条目。请用 2-3 句中文写出「今日主线」。",
    "要求：把它们串成一条线索，说明共同指向什么变化或趋势；不要罗列条目，不要复述标题，要给出判断；不超过 120 字；直接输出这段文字，不要 JSON。",
  ].join("\n");

  const user = cards
    .map((card, index) => index + 1 + ". [" + card.topic + "] " + card.title + "：" + card.summary)
    .join("\n");

  return { system, user };
}

export async function summarizeMainline(cards, { config, postJsonImpl = postJson, retries = 1 } = {}) {
  if (!config?.apiKey) {
    throw new Error("缺少 LLM_API_KEY，无法生成主线");
  }

  const timeoutMs = config.timeoutMs ?? 60000;
  const { system, user } = buildMainlinePrompt(cards);
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(
        postJsonImpl(
          config.baseUrl + "/chat/completions",
          {
            model: config.model,
            temperature: 0.4,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          },
          { headers: { authorization: "Bearer " + config.apiKey }, timeoutMs },
        ),
        timeoutMs,
        "主线生成",
      );

      const content = String(response?.choices?.[0]?.message?.content ?? "").trim();
      if (content.length === 0) {
        throw new Error("主线内容为空");
      }
      return content.replace(/^["「『]/, "").replace(/["」』]$/, "").slice(0, 200);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export function fallbackCard(item) {
  const raw = String(item.content || item.title).trim();
  return {
    title: item.title,
    summary: raw.slice(0, 50),
    what: raw.slice(0, 160),
    highlights: "这条内容还没完成精读，先保留原始链接，避免漏掉线索。",
    productView: "可以先记下这条线索，等更多信息出来再判断它的产品价值。",
    readTime: "1 分钟",
  };
}