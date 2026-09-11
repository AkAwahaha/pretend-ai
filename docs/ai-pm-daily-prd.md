# PRD：假装懂 AI

产品名含义：不是假装懂技术，而是用产品的视野看问题。

## 一句话定位

每天早上打开手机网页，5 分钟看完 AI 圈大事和 GitHub 高分项目，每条都告诉你：这是什么、亮点和实现思路是什么、用产品视野怎么看。

## 问题

- AI 资讯和项目更新太快，准备 AI PM 面试的人没时间筛选
- 自媒体内容碎片化、标题党，看完讲不出所以然
- GitHub README 偏技术，产品经理难提炼实现思路和产品价值
- 资讯与产品判断之间缺一座桥

## 目标用户

- 第一阶段：正在准备 AI 产品经理面试的人（先满足自己）
- 扩展：想转型或入行 AI 产品，需要快速建立行业认知的人

## 现在的解决方式与问题

- 刷公众号、小红书、即刻等自媒体平台
- 偶尔看 GitHub Trending、Hacker News
- 用 ChatGPT 零散提问

问题：被动接收、信息碎片、收藏了不看、无法转化为产品判断。

## 竞品与借鉴

- 机器之心 / 量子位 / TLDR AI：资讯全，但面向“知道发生了什么”
- GitHub Trending / HelloGitHub / Trendshift：列项目，不讲产品视角
- Perplexity / ChatGPT：需要主动提问，不会每日主动整理

借鉴：日报的固定节奏、Trending 的发现机制、面试题库的结构化表达。

## 差异化

每条内容回答三个问题：

1. 这是什么（一句话说清）
2. 核心亮点 / 实现思路（人话版）
3. 用产品视野怎么看（可能的问题 + 回答框架）

定位：不是资讯堆砌，而是“用产品视野看的 AI 情报 + 项目拆解”。

## 信息源

MVP 默认五类：

1. 一手官方：OpenAI Blog、Anthropic News、Google DeepMind Blog
2. 省时日报：TLDR AI、The Batch
3. 前沿论文：Hugging Face Daily Papers、arXiv（cs.CL / cs.AI）
4. 项目发现：GitHub Trending、GitHub API（topic 为 llm / ai-agents，按近期星标增速）、Trendshift
5. 商业视角：a16z AI、Menlo Ventures 报告

备选与后续扩展：TechCrunch AI、The Verge AI、MIT Technology Review、机器之心、量子位、新智元、Founder Park、海外独角兽、特工宇宙、Import AI、Ben's Bites、Lenny's Newsletter、Stanford HAI AI Index、LMArena、Hugging Face Trending。

### 已实测可用（2026-09-12 验证）

- OpenAI Blog RSS：https://openai.com/news/rss.xml
- Google DeepMind Blog RSS：https://deepmind.google/blog/rss.xml
- TLDR AI RSS：https://tldr.tech/api/rss/ai
- Menlo Ventures RSS：https://menlovc.com/feed/
- GitHub Search API：https://api.github.com/search/repositories（按主题 + 近期活跃度 + star 排序）

### 待接入 / 受限

- Hugging Face Daily Papers API：当前网络被挡，作为可选源，在 GitHub Actions 环境重试
- arXiv API：当前网络被挡，作为可选源
- Anthropic News：没有公开 RSS，第一版用 HTML 抓取标题，后续再找稳定接口
- a16z AI：feed 返回 404，后续更换路径或手动补充

### 抓取说明

公众号、小红书、抖音没有稳定接口，第一版以手动补充链接为主。单个来源失败不影响整体生成，管线会跳过并在日志中标注。

## MVP 范围

包含：

- 每天自动生成一份日报（默认早上 8:00）
- 混合深度：3 条精读 + 5~8 条速览
- 精读内容覆盖 AI 资讯和 GitHub 高分项目
- 每条包含：来源链接、一句话摘要、亮点/思路、产品视角
- 手机适配网页，支持收藏和回看历史
- 静态站点，每日自动更新

不包含：

- 用户账号、多用户、个性化推荐
- 社交、评论、排行榜
- 原生 App、推送通知（第一版只在网页看）
- 自动生成完整面试题库

## 内容规范

- 所有内容用简体中文输出；公司名、产品名、模型名、开源仓库名可以保留英文
- 标题用中文概括，开源项目保留 owner/repo
- 阅读时长用「X 分钟」格式
- 生成结果经过校验，出现整句未翻译英文时自动重试

## 发布形态

- 第一阶段：手机适配网页（PWA 可选），每日自动更新
- 第二阶段：邮件 / 微信推送

## 后期规划（先不做）

- 知识库能力：标签体系、搜索、个人笔记、按主题聚合
- 文档沉淀：周报 / 月报自动生成，导出 Markdown / PDF

## 技术可行性

- 前端：静态网页（Vite + React 或纯静态），手机适配，部署到 Vercel / Netlify / GitHub Pages
- 后端：无常驻服务器，用 GitHub Actions 每天定时抓取并生成页面
- 数据获取：RSS / API 优先，自媒体内容手动补充
- AI：付费 LLM API 做摘要、亮点提炼和产品视角生成，每天几十条内容，成本可控
- 部署：GitHub Actions 定时生成 + Pages 托管，服务器成本为零
- 风险：自媒体抓取不稳定、内容版权（只做摘要 + 原文链接）、AI 幻觉（保留原文链接供核对）

## LLM 接入

- 协议：OpenAI 兼容的 Chat Completions 接口，通过环境变量配置，不写死在代码里
  - `LLM_API_KEY`：API 密钥
  - `LLM_BASE_URL`：接口地址，默认 `https://api.openai.com/v1`
  - `LLM_MODEL`：模型名，默认 `gpt-4o-mini`
- 每条内容生成结构化卡片：`summary`、`what`、`highlights`、`productView`
- 输出必须是 JSON，经 schema 校验；不合格自动重试，最多 2 次
- 成本控制：每天最多 8 条、输入截断 2500 字符、按内容哈希缓存、失败时降级为标题 + 摘要
- API Key 只放在本地 `.env` 或 GitHub Secrets，禁止提交到仓库

## 待确认

- 每日更新时间（默认 8:00）
- 是否要邮件 / 微信推送（第二版）
