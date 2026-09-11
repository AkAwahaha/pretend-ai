import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPrompt, extractJson, getLlmConfig, summarizeItem, validateCard } from "../src/llm.js";

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
    });
    assert.equal(result.ok, true);
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