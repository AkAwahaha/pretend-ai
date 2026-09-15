# 信息源清单

日报的每条内容都来自下面这些信息源。选源遵循四条标准：

1. **权威性**：一手官方或行业公认的媒体，避免二手转述失真
2. **时效性**：更新频率高，能反映最近的动态
3. **可抓取性**：有稳定的 RSS / API，或结构清晰、可解析的页面
4. **面试价值**：能支撑"用产品视野看问题"，而不只是技术细节

目前共接入 **20 个源**，分 7 类。

## 一手官方

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| OpenAI Blog | RSS：`https://openai.com/news/rss.xml` | 官方发布模型、产品与研究进展 | 面试最需要的一手信息，避免被二手解读带偏 |
| Anthropic News | HTML 抓取：`https://www.anthropic.com/news` | Claude 能力、安全与对齐实践 | 安全、Agent 方向的一手材料，AI PM 面试高频考点 |

## 国内动态

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| 量子位 | RSS：`https://www.qbitai.com/feed` | 国内 AI 媒体，覆盖模型、产品与产业 | 中文语境下更新快，快速掌握国内进展 |
| 新智元 | RSS：`https://www.aiera.com.cn/feed` | 国内 AI 资讯，偏热点与人物观点 | 热点事件覆盖快，如 AI 是否该降速的讨论 |
| InfoQ 中文 | RSS：`https://www.infoq.cn/feed` | 技术媒体，偏工程与落地 | 能看到企业级 AI 落地与 Agent 工程实践 |
| 钛媒体 | RSS：`https://www.tmtpost.com/rss.xml` | 商业科技媒体，偏公司与资本 | 融资、并购、商业模式视角 |
| 雷峰网 | RSS：`https://www.leiphone.com/feed` | AI 与硬科技媒体 | 机器人、具身智能与创业公司动态 |

## 行业新闻

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| TechCrunch AI | RSS：`https://techcrunch.com/category/artificial-intelligence/feed/` | 全球科技创投媒体 | 融资、收购、产品发布的英文一手报道 |
| The Verge AI | RSS：`https://www.theverge.com/rss/ai-artificial-intelligence/index.xml` | 科技媒体，关注行业与政策讨论 | 行业争议与政策话题，如"AI 该不该降速" |
| Ars Technica | RSS：`https://feeds.arstechnica.com/arstechnica/technology-lab` | 深度科技媒体 | 技术与社会影响的深度分析 |
| Hacker News | RSS：`https://hnrss.org/frontpage?points=200` | 技术社区热榜（200 分以上） | 工程师群体真实关注的话题，判断技术热度 |
| MIT Tech Review | RSS：`https://www.technologyreview.com/feed/` | 麻省理工科技评论 | 长期趋势与产业分析，适合宏观判断 |
| 爱范儿 | RSS：`https://www.ifanr.com/feed` | 科技消费媒体 | 面向消费者的 AI 产品与硬件动态 |

## 项目发现

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| GitHub Search API | API：topic 为 `llm`，star > 500，近 30 天有更新 | 开源项目发现 | 直接看项目实现思路，面试讲技术方案时的素材 |

## 省时日报

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| TLDR AI | RSS：`https://tldr.tech/api/rss/ai` | 每日 AI 新闻摘要 | 覆盖广、已筛选，兜住其他源漏掉的事项 |

## 商业视角

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| Menlo Ventures | RSS：`https://menlovc.com/feed/` | 硅谷风投，发布企业级 AI 报告 | 从投资视角看企业 AI 的真实落地与预算 |
| Crunchbase News | RSS：`https://news.crunchbase.com/feed/` | 创投数据媒体 | 融资与并购动态，判断资本流向 |

## 前沿论文

| 来源 | 抓取方式 | 简介 | 为什么选 |
| --- | --- | --- | --- |
| Google DeepMind Blog | RSS：`https://deepmind.google/blog/rss.xml` | 官方研究博客 | 前沿研究的产品化潜力 |
| Hugging Face Daily Papers | API：`https://huggingface.co/api/daily_papers` | 每日论文热榜 | 快速了解当天最受关注的论文 |
| arXiv cs.CL | API：`http://export.arxiv.org/api/query` | 预印本论文 | 最前沿的 NLP 研究，建立技术判断（暂无工具：官方的是 http 接口） |

## 暂未接入的源

| 来源 | 原因 |
| --- | --- |
| 机器之心 | RSS 已下线，接口返回网页 |
| 36氪 | 无稳定 RSS，接口返回网页 |
| 晚点 LatePost | TLS 证书异常 |
| Founder Park | 域名解析失败 |
| 虎嗅 | RSS 请求超时 |
| 智东西 | feed 返回 500 |
| 品玩 | feed 404 |
| VentureBeat AI | 限流 429 |
| a16z | feed 404 |
| 公众号 / 小红书 / 抖音 | 无稳定接口，需要手动补充链接 |

## 覆盖边界

每个源只读取最新 3-5 条，超出窗口的内容不会进入候选池。所以像"智谱融资"这类已经过了一两天的消息，会因为滑出 RSS 窗口而抓不到——这也是它没出现在日报里的原因，不是解析失败。

要覆盖这类内容，后续有两个方向：

1. 接入关键词搜索源（Google News / Bing News 的 RSS 搜索）
2. 支持手动提交链接，由管线统一生成卡片

## 每日选取规则

1. 先去重，并按已发布索引过滤，优先只选新内容
2. 按**内容类型轮询**：每类至少出一条，避免某一类消失
3. 同类目内按**来源轮换**（用日期做种子），避免单一来源长期霸榜
4. 最终产出 3 条精读 + 5 条速览