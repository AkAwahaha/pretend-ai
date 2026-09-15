import type { SourceKey } from "../types";

export const SOURCE_META: Record<SourceKey, { label: string; color: string; tint: string }> = {
  openai: { label: "OpenAI", color: "#0EA371", tint: "#E4F7EF" },
  github: { label: "GitHub", color: "#7C3AED", tint: "#F0E9FE" },
  anthropic: { label: "Anthropic", color: "#F97316", tint: "#FEF0E7" },
  deepmind: { label: "DeepMind", color: "#3B82F6", tint: "#E8F1FE" },
  huggingface: { label: "Hugging Face", color: "#F59E0B", tint: "#FEF5E3" },
  tldr: { label: "TLDR AI", color: "#EC4899", tint: "#FDEAF4" },
  a16z: { label: "a16z", color: "#14B8A6", tint: "#E3F8F5" },
  menlo: { label: "Menlo", color: "#2563EB", tint: "#E7EFFE" },
  arxiv: { label: "arXiv", color: "#EF4444", tint: "#FDECEC" },
  qbitai: { label: "量子位", color: "#0EA5E9", tint: "#E4F4FD" },
  aiera: { label: "新智元", color: "#E11D48", tint: "#FDE8ED" },
  infoq: { label: "InfoQ 中文", color: "#0F766E", tint: "#E2F3F1" },
  techcrunch: { label: "TechCrunch", color: "#65A30D", tint: "#EDF6DC" },
  theverge: { label: "The Verge", color: "#C026D3", tint: "#F9E6FB" },
  arstechnica: { label: "Ars Technica", color: "#B45309", tint: "#F8EDE0" },
  hackernews: { label: "Hacker News", color: "#EA580C", tint: "#FDECE3" },
  mittechreview: { label: "MIT Tech Review", color: "#1D4ED8", tint: "#E5EDFC" },
  crunchbase: { label: "Crunchbase", color: "#0891B2", tint: "#E2F4F8" },
};

export const CATEGORIES = [
  "全部",
  "一手官方",
  "国内动态",
  "行业新闻",
  "项目发现",
  "省时日报",
  "商业视角",
  "前沿论文",
] as const;

export type Category = (typeof CATEGORIES)[number];
