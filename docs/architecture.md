# 系统架构

## 目标

每天自动产出一份面向 AI 产品经理的中文日报：3 条精读 + 5 条速览，每条都回答"这是什么 / 核心亮点与实现思路 / 用产品视野怎么看"。

## 总体流程

```
GitHub Actions（每小时尝试，当天日报已存在则跳过）
   │
   ├─ 1. 抓取       pipeline/src/sources.js
   ├─ 2. 去重过滤    pipeline/src/generate.js + pipeline/src/seen.js
   ├─ 3. 选取排序    pipeline/src/generate.js
   ├─ 4. 大模型生成  pipeline/src/llm.js
   ├─ 5. 写入输出    pipeline/src/generate.js
   ├─ 6. 测试构建    pipeline/test + web
   └─ 7. 部署        .github/workflows/daily-digest.yml
```

## 1. 抓取

八个信息源，按类型走不同通道：

| 类型 | 来源 | 通道 |
| --- | --- | --- |
| RSS | OpenAI、DeepMind、TLDR AI、Menlo Ventures | RSS 解析 |
| Atom | arXiv | Atom 解析 |
| JSON API | GitHub Search、Hugging Face Daily Papers | API 调用 |
| HTML | Anthropic News | 链接与标题抽取 |

单源失败只记录警告并跳过，不影响整体生成。Hugging Face 与 arXiv 在部分网络环境不可达时同样自动跳过。

## 2. 去重与已发布过滤

- 标题规范化去重，避免同一条内容从多个来源重复进入
- `pipeline/data/seen.json` 记录所有已发布内容的 URL 与日期
- 优先只选未见过的内容；新内容不足一半时，才用历史内容补位，避免页面空掉
- 工作流每天把索引提交回仓库，跨天持续生效

## 3. 排序与选取

排序优先级：一手官方 > 项目发现 > 省时日报 > 商业视角 > 前沿论文，同级按发布时间倒序。

选取采用**按来源轮询**：每个来源轮流贡献一条，凑满 8 条为止。这样保证来源多样性，避免被单一来源占满。前 3 条标记为精读，其余为速览。

## 4. 大模型生成

走 OpenAI 兼容的 Chat Completions 协议，通过环境变量配置地址与模型。每条内容独立生成一张结构化卡片：

- `summary`：80-120 字完整概述
- `what`：这是什么
- `highlights`：核心亮点与实现思路
- `productView`：产品视角

保护机制：输出必须通过字段校验；出现整句未翻译英文判为不合格；失败自动重试最多 2 次；最终仍失败则降级为"标题 + 原文摘要"，保证流水线不中断。

## 5. 输出

写入 `web/public/data/`：

- `latest.json`：今日日报
- `archive/YYYY-MM-DD.json`：按天归档，前端历史页读取
- `index.json`：历史索引，含日期、标题、来源与条数

归档文件随仓库一同提交，因此历史可以长期累积。

## 6. 前端

静态站点，运行时读取 `latest.json` 渲染；读取失败时回退到内置示例数据。路由使用 hash（今日 / 详情 / 收藏 / 历史），收藏存 localStorage，不依赖后端。

## 7. 部署

GitHub Actions 每小时尝试一次，先检查当天归档是否已存在：存在则跳过，不存在才执行抓取、生成、测试、构建与部署。也可手动触发并勾选 `force` 强制重新生成。

## 关键取舍

- **不做数据库**：每天一份 JSON 足够，静态托管零成本、零运维
- **按来源轮询而非重要性打分**：优先保证来源多样性，牺牲一点单条重要性；若更看重热度，可改为打分制
- **已发布过滤**：解决"没新闻时重复推送"的问题，代价是需要把索引回写仓库
- **无账号体系**：收藏存本地，降低复杂度

## 后续演进

- 知识库能力：标签、搜索、个人笔记、主题聚合
- 文档沉淀：周报 / 月报导出 Markdown 或 PDF
- Obsidian 联动：日报导出为带 frontmatter 的 Markdown 笔记
- RAG 问答：基于沉淀的笔记库做检索增强问答