import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMainlinePrompt,
  buildPrompt,
  extractJson,
  getLlmConfig,
  normalizeTakeaways,
  normalizeTopic,
  summarizeItem,
  summarizeMainline,
  summarizeTakeaways,
  validateCard,
} from "../src/llm.js";

const rawItem = {
  sourceKey: "openai",
  sourceLabel: "OpenAI",
  category: "一手官方",
  title: "Sample title",
  url: "https://example.com/post",
  content: "Sample content",
};

describe("extractJson", () => {
  it("能剥离 markdown 代码块", () => {
    const value = extractJson('```json\n{"title":"A"}\n```');
    assert.deepEqual(value, { title: "A" });
  });

  it("没有 JSON 时抛错", () => {
    assert.throws(() => extractJson("no json here"));
  });
});

describe("validateCard", () => {
  it("缺字段时返回错误", () => {
    const result = validateCard({ title: "A" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  });

  it("检测未翻译的整句英文", () => {
    const result = validateCard({
      title: "A",
      summary: "This is a long English sentence that was not translated at all",
      what: "C",
      highlights: "D",
      productView: "E",
    });
    assert.equal(result.ok, false);
  });

  it("字段齐全时通过", () => {
    const result = validateCard({
      title: "A",
      summary: "B",
      what: "C",
      highlights: "D",
      productView: "E",
      topic: "模型技术快讯",
      heat: 70,
    });
    assert.equal(result.ok, true);
  });
});

describe("normalizeTopic", () => {
  it("识别合法分类", () => {
    assert.equal(normalizeTopic("商业资本动态"), "商业资本动态");
  });

  it("把未知分类兜底为模型技术快讯", () => {
    assert.equal(normalizeTopic("随便写的分类"), "模型技术快讯");
    assert.equal(normalizeTopic(""), "模型技术快讯");
  });
});

describe("summarizeMainline", () => {
  it("使用模型输出生成主线文案", async () => {
    const postJsonImpl = async () => ({
      choices: [{ message: { content: "今天的主线是模型能力与算力成本同时变化。" } }],
    });
    const text = await summarizeMainline([{ topic: "模型技术快讯", title: "T", summary: "S" }], {
      config: { apiKey: "test", baseUrl: "https://api.test/v1", model: "m" },
      postJsonImpl,
    });
    assert.ok(text.includes("主线"));
  });

  it("去掉包裹的引号", async () => {
    const postJsonImpl = async () => ({
      choices: [{ message: { content: "「被引号包住的主线」" } }],
    });
    const text = await summarizeMainline([{ topic: "t", title: "T", summary: "S" }], {
      config: { apiKey: "test", baseUrl: "https://api.test/v1", model: "m" },
      postJsonImpl,
    });
    assert.equal(text, "被引号包住的主线");
  });
});

describe("normalizeTakeaways", () => {
  it("只保留非空字符串并最多取 3 条", () => {
    const result = normalizeTakeaways(["a", "  ", "b", "c", "d"]);
    assert.deepEqual(result, ["a", "b", "c"]);
  });

  it("非数组返回空", () => {
    assert.deepEqual(normalizeTakeaways(undefined), []);
    assert.deepEqual(normalizeTakeaways({ takeaways: ["a"] }), []);
  });
});

describe("summarizeTakeaways", () => {
  it("解析模型返回的 JSON", async () => {
    const postJsonImpl = async () => ({
      choices: [{ message: { content: '{"takeaways":["收获一","收获二","收获三"]}' } }],
    });
    const result = await summarizeTakeaways([{ topic: "t", title: "T", summary: "S" }], {
      config: { apiKey: "test", baseUrl: "https://api.test/v1", model: "m" },
      postJsonImpl,
    });
    assert.equal(result.length, 3);
    assert.equal(result[0], "收获一");
  });
});

describe("buildMainlinePrompt", () => {
  it("把全部条目拼进 user 提示", () => {
    const prompt = buildMainlinePrompt([
      { topic: "模型技术快讯", title: "标题一", summary: "摘要一" },
      { topic: "商业资本动态", title: "标题二", summary: "摘要二" },
    ]);
    assert.ok(prompt.user.includes("标题一"));
    assert.ok(prompt.user.includes("标题二"));
    assert.ok(prompt.system.includes("主线"));
  });
});

describe("getLlmConfig", () => {
  it("读取环境变量并去掉尾部斜杠", () => {
    const config = getLlmConfig({ LLM_API_KEY: "k", LLM_BASE_URL: "https://api.test/v1/", LLM_MODEL: "m" });
    assert.equal(config.baseUrl, "https://api.test/v1");
    assert.equal(config.configured, true);
  });

  it("缺少密钥时标记未配置", () => {
    assert.equal(getLlmConfig({}).configured, false);
  });
});

describe("summarizeItem", () => {
  it("使用模型输出生成结构化卡片", async () => {
    const postJsonImpl = async () => ({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "标题",
              summary: "摘要",
              what: "是什么",
              highlights: "亮点",
              productView: "产品视角",
              readTime: "2 min",
              topic: "模型技术快讯",
              heat: 70,
            }),
          },
        },
      ],
    });

    const card = await summarizeItem(rawItem, {
      config: { apiKey: "test", baseUrl: "https://api.test/v1", model: "test-model" },
      postJsonImpl,
    });

    assert.equal(card.summary, "摘要");
    assert.equal(card.readTime, "2 分钟");
  });
});

describe("buildPrompt", () => {
  it("包含来源与截断后的内容", () => {
    const prompt = buildPrompt({ ...rawItem, content: "x".repeat(5000) });
    assert.ok(prompt.user.includes("OpenAI"));
    assert.equal(prompt.user.includes("x".repeat(2501)), false);
  });
});