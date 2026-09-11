import type { DigestItem } from "../types";

export function ThreeQuestionCard({ item }: { item: DigestItem }) {
  return (
    <section className="three-question">
      <div>
        <h3 className="three-question__title">这是什么</h3>
        <p className="three-question__body">{item.what}</p>
      </div>
      <div>
        <h3 className="three-question__title">核心亮点 · 实现思路</h3>
        <p className="three-question__body">{item.highlights}</p>
      </div>
      <div>
        <h3 className="three-question__title">产品视角</h3>
        <p className="three-question__body">{item.productView}</p>
      </div>
    </section>
  );
}
