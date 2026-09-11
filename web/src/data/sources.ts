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
};

export const CATEGORIES = [
  "全部",
  "一手官方",
  "省时日报",
  "前沿论文",
  "项目发现",
  "商业视角",
] as const;

export type Category = (typeof CATEGORIES)[number];
