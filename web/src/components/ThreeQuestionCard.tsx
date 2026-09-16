import { Lightbulb, Sparkles, Target } from "lucide-react";
import type { DigestItem } from "../types";

const SECTIONS = [
  { key: "what", index: "01", title: "这是什么", icon: Lightbulb },
  { key: "highlights", index: "02", title: "核心亮点 · 实现思路", icon: Sparkles },
  { key: "productView", index: "03", title: "产品视角", icon: Target },
] as const;

export function ThreeQuestionCard({ item }: { item: DigestItem }) {
  return (
    <section className="question-list">
      {SECTIONS.map(({ key, index, title, icon: Icon }) => (
        <div className="question" key={key}>
          <div className="question__title">
            <span className="question__icon">
              <Icon size={14} />
            </span>
            <span className="question__label">{title}</span>
            <span className="question__index">{index}</span>
          </div>
          <p className="question__body">{item[key]}</p>
        </div>
      ))}
    </section>
  );
}