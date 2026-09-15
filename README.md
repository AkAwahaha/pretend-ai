# 假装懂 AI

> 不是假装懂技术，而是用产品的视野看问题。

每天早上 5 分钟，看完 AI 圈大事和 GitHub 高分项目。每条内容回答三个问题：**这是什么**、**核心亮点与实现思路**、**用产品视野怎么看**。

线上地址：https://akawahaha.github.io/pretend-ai/

## 它做什么

- 从 8 个信息源抓取当天内容：OpenAI、Anthropic、Google DeepMind、TLDR AI、Menlo Ventures、GitHub、Hugging Face、arXiv
- 清洗去重，并按已发布索引过滤，优先只推新内容
- 按来源轮询选取，保证来源多样性：3 条精读 + 5 条速览
- 调用大模型生成中文结构化卡片（标题、概述、亮点思路、产品视角）
- 每天自动生成并部署，手机浏览器打开即用，电脑关机不影响

## 架构

```
GitHub Actions（每小时尝试，当天日报已存在则跳过）
   │
   ├─ 1. 抓取 8 个信息源（单个失败自动跳过）
   ├─ 2. 清洗去重 + 已发布过滤（pipeline/data/seen.json）
   ├─ 3. 排序 + 按来源轮询，选出 8 条（前 3 条为精读）
   ├─ 4. 调用大模型生成结构化卡片（OpenAI 兼容接口）
   ├─ 5. 写入 JSON（latest / index / archive）
   ├─ 6. 跑测试并构建静态站点
   └─ 7. 部署到 GitHub Pages
```

详细说明见 [docs/architecture.md](docs/architecture.md)，信息源清单见 [docs/sources.md](docs/sources.md)。

## 目录结构

```
.
├── docs/                     # 产品与设计文档
│   ├── prd.md                # 产品需求
│   ├── architecture.md       # 系统架构与流程
│   ├── tech-design.md        # 技术选型与数据契约
│   └── ui-spec.md            # UI 设计规格
├── pipeline/                 # 数据管线：抓取 + 大模型生成
│   ├── src/                  # 源码
│   ├── test/                 # 单元测试
│   └── data/seen.json        # 已发布索引（跨天去重）
├── web/                      # 前端：移动端日报
│   ├── src/                  # 组件、页面、hooks
│   └── public/data/          # 生成的日报 JSON 与历史归档
├── .github/workflows/        # 每日自动生成与部署
├── agent.md                  # 协作规则
└── package.json              # 统一命令入口
```

## 快速开始

```bash
# 安装依赖
npm --prefix pipeline install
npm --prefix web install

# 配置大模型（复制后填入 API Key）
cp pipeline/.env.example pipeline/.env

# 只抓取不调用大模型，验证信息源
npm run fetch

# 完整生成（抓取 + 大模型摘要 + 写入 web/public/data）
npm run generate

# 本地预览
npm run dev

# 跑全部测试
npm test

# 生产构建
npm run build
```

## 部署

推送到 `master` 后由 GitHub Actions 自动处理：

- 定时：每小时尝试一次，当天日报已存在则跳过
- 手动：Actions → Daily Digest → Run workflow，可勾选 `force` 强制重新生成
- 密钥：`LLM_API_KEY` 存在仓库 Secret，`LLM_BASE_URL`、`LLM_MODEL` 存在仓库 Variables

## 技术栈

- 前端：Vite + React + TypeScript，纯 CSS（设计 token 用 CSS 变量）
- 管线：Node.js ESM，零框架，`fast-xml-parser` 解析 RSS/Atom
- 大模型：OpenAI 兼容的 Chat Completions 接口，默认 DeepSeek
- 部署：GitHub Actions + GitHub Pages，无服务器