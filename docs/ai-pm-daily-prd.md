# PRD：AI PM 每日情报（暂定名）

## 一句话定位

每天早上打开手机网页，5 分钟看完 AI 圈大事和 GitHub 高分项目，每条都告诉你：这是什么、亮点和实现思路是什么、面试怎么讲。

## 问题

- AI 资讯和项目更新太快，准备 AI PM 面试的人没时间筛选
- 自媒体内容碎片化、标题党，看完讲不出所以然
- GitHub README 偏技术，产品经理难提炼实现思路和产品价值
- 资讯与面试问题之间缺一座桥

## 目标用户

- 第一阶段：正在准备 AI 产品经理面试的人（先满足自己）
- 扩展：想转型或入行 AI 产品，需要快速建立行业认知的人

## 现在的解决方式与问题

- 刷公众号、小红书、即刻等自媒体平台
- 偶尔看 GitHub Trending、Hacker News
- 用 ChatGPT 零散提问

问题：被动接收、信息碎片、收藏了不看、无法转化为面试表达。

## 竞品与借鉴

- 机器之心 / 量子位 / TLDR AI：资讯全，但面向“知道发生了什么”
- GitHub Trending / HelloGitHub / Trendshift：列项目，不讲产品视角
- Perplexity / ChatGPT：需要主动提问，不会每日主动整理

借鉴：日报的固定节奏、Trending 的发现机制、面试题库的结构化表达。

## 差异化

每条内容回答三个问题：

1. 这是什么（一句话说清）
2. 核心亮点 / 实现思路（人话版）
3. 面试里怎么用（可能的问题 + 回答框架）

定位：不是资讯堆砌，而是“面试导向的 AI 情报 + 项目拆解”。

## 信息源

MVP 默认五类：

1. 一手官方：OpenAI Blog、Anthropic News、Google DeepMind Blog
2. 省时日报：TLDR AI、The Batch
3. 前沿论文：Hugging Face Daily Papers、arXiv（cs.CL / cs.AI）
4. 项目发现：GitHub Trending、GitHub API（topic 为 llm / ai-agents，按近期星标增速）、Trendshift
5. 商业视角：a16z AI、Menlo Ventures 报告

备选与后续扩展：TechCrunch AI、The Verge AI、MIT Technology Review、机器之心、量子位、新智元、Founder Park、海外独角兽、特工宇宙、Import AI、Ben's Bites、Lenny's Newsletter、Stanford HAI AI Index、LMArena、Hugging Face Trending。

抓取说明：官方博客、GitHub、arXiv、Hugging Face 和部分媒体有 RSS 或 API，可自动抓取；公众号、小红书、抖音没有稳定接口，第一版以手动补充链接为主。

## MVP 范围

包含：

- 每天自动生成一份日报（默认早上 8:00）
- 混合深度：3 条精读 + 5~8 条速览
- 精读内容覆盖 AI 资讯和 GitHub 高分项目
- 每条包含：来源链接、一句话摘要、亮点/思路、面试视角
- 手机适配网页，支持收藏和回看历史
- 静态站点，每日自动更新

不包含：

- 用户账号、多用户、个性化推荐
- 社交、评论、排行榜
- 原生 App、推送通知（第一版只在网页看）
- 自动生成完整面试题库

## 发布形态

- 第一阶段：手机适配网页（PWA 可选），每日自动更新
- 第二阶段：邮件 / 微信推送、搜索、收藏夹

## 技术可行性

- 前端：静态网页（Vite + React 或纯静态），手机适配，部署到 Vercel / Netlify / GitHub Pages
- 后端：无常驻服务器，用 GitHub Actions 每天定时抓取并生成页面
- 数据获取：RSS / API 优先，自媒体内容手动补充
- AI：付费 LLM API 做摘要、亮点提炼和面试视角生成，每天几十条内容，成本可控
- 部署：GitHub Actions 定时生成 + Pages 托管，服务器成本为零
- 风险：自媒体抓取不稳定、内容版权（只做摘要 + 原文链接）、AI 幻觉（保留原文链接供核对）

## 待确认

- 产品名
- 每日更新时间（默认 8:00）
- 是否要邮件 / 微信推送（第二版）
