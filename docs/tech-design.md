# 技术方案：假装懂 AI

## 技术选型

- 前端：Vite + React + TypeScript，纯 CSS（设计 token 用 CSS 变量）
- 路由：hash 路由（今日 / 详情 / 收藏 / 历史），不引入 react-router
- 状态：React state + localStorage（收藏）
- 测试：Vitest + Testing Library
- 数据：静态 JSON，由后续 pipeline 每日生成
- 部署：GitHub Pages / Vercel 静态托管

## 目录结构

```
web/
  index.html
  package.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    styles/tokens.css
    styles/global.css
    types.ts
    data/digest.ts
    data/history.ts
    hooks/useFavorites.ts
    hooks/useHashRoute.ts
    components/
    pages/
```

## 数据契约

```ts
type SourceKey =
  | "openai" | "github" | "anthropic" | "deepmind"
  | "huggingface" | "tldr" | "a16z" | "arxiv";

interface DigestItem {
  id: string;
  source: SourceKey;
  sourceLabel: string;
  category: string;
  title: string;
  summary: string;
  what: string;
  highlights: string;
  productView: string;
  sourceUrl: string;
  readTime: string;
  featured: boolean;
}

interface DailyDigest {
  date: string;
  label: string;
  headline: string;
  kicker: string;
  items: DigestItem[];
}
```

## 路由与状态

- `#/today` 今日日报（默认）
- `#/item/:id` 内容详情
- `#/favorites` 收藏
- `#/history` 历史日报
- 收藏存 localStorage，key 为 `pretend-ai:favorites`

## 测试策略

- 单元测试：收藏增删与持久化、hash 路由解析
- 组件测试：精读卡与速览行渲染、来源色彩映射
- 视觉验证：Playwright 以 375px 移动端视口截图走查

## 与 pipeline 的衔接

pipeline 每日产出 `digest-YYYY-MM-DD.json` 与 `index.json`，前端构建时读取并渲染。MVP 先用 mock 数据把 UI 和交互跑通，再接真实数据。
