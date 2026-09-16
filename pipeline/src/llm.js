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
    "只输出 JSON，不要输出解释文字。JSON 结构：{title, summary, what, highlights, productView, readTime, topic, heat}。",
    "heat 是这条内容的关注度评分（0-100 的整数）。判断依据：是否有多家媒体报道、是否涉及头部公司或重大发布、是否会引发行业讨论。常规产品更新 30-50，重要发布或融资 60-80，行业级事件 80-100。",
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

export function normalizeHeat(value) {
  const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number)) {
    return 50;
  }
  return Math.round(Math.min(100, Math.max(0, number)));
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
  if (value?.heat === undefined || value?.heat === null || String(value.heat).trim().length === 0) {
    errors.push("缺少字段：heat");
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
        heat: normalizeHeat(parsed.heat),
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