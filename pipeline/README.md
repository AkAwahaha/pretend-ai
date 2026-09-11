# 抓取与生成管线

每天抓取 AI 信息源，调用大模型生成结构化日报，输出到 `web/public/data`，供前端直接读取。

## 本地运行

1. 准备 `.env`（可从 `.env.example` 复制）：

```
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
MAX_ITEMS=8
FEATURED_COUNT=3
```

`LLM_BASE_URL` 兼容任何 OpenAI 格式的 Chat Completions 接口，DeepSeek、OpenRouter、通义等改这里即可。

2. 只抓取，不调用大模型（用于验证信息源）：

```
npm run fetch
```

3. 完整生成（抓取 + 大模型摘要 + 写入 `web/public/data`）：

```
npm run generate
```

4. 运行测试：

```
npm test
```

## 信息源

已实测可用：

- OpenAI Blog RSS
- Google DeepMind Blog RSS
- TLDR AI RSS
- Menlo Ventures RSS
- GitHub Search API（topic: llm，按 star 排序，近 30 天有更新）
- Anthropic News（无 RSS，HTML 抓取标题与摘要）

受限或待接入：

- Hugging Face Daily Papers API：本地网络超时，GitHub Actions 环境会重试
- arXiv API：本地网络被重置，GitHub Actions 环境会重试
- a16z：feed 404，待更换路径

单个来源失败不会中断生成，管线会跳过并在日志中标注。

## 输出

- `web/public/data/latest.json`：最新日报
- `web/public/data/archive/YYYY-MM-DD.json`：历史归档
- `web/public/data/index.json`：历史索引

## 成本控制

- 每天最多生成 8 条（`MAX_ITEMS`）
- 单条输入截断 2500 字符
- 输出必须通过 schema 校验，失败自动重试最多 2 次
- 未配置密钥时自动降级为标题 + 摘要，不会中断流程

## 定时任务

`.github/workflows/daily-digest.yml` 每天北京时间 08:00 运行，抓取、生成、测试、构建并部署到 GitHub Pages。需要在仓库里配置：

- Secret：`LLM_API_KEY`
- Variables：`LLM_BASE_URL`、`LLM_MODEL`（可选）