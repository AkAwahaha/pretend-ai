import { Lightbulb, Sparkles, Target } from "lucide-react";
import type { DigestItem } from "../types";

const SECTIONS = [
  { key: "what", title: "这是什么", icon: Lightbulb, tone: "blue" },
  { key: "highlights", title: "核心亮点 · 实现思路", icon: Sparkles, tone: "violet" },
  { key: "productView", title: "产品视角", icon: Target, tone: "teal" },
] as const;

export function ThreeQuestionCard({ item }: { item: DigestItem }) {
  return (
    <section className="question-list">
      {SECTIONS.map(({ key, title, icon: Icon, tone }) => (
        <div className={`question question--${tone}`} key={key}>
          <div className="question__title">
            <span className="question__icon">
              <Icon size={14} />
            </span>
            {title}
          </div>
          <p className="question__body">{item[key]}</p>
        </div>
      ))}
    </section>
  );
}