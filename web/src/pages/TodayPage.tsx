import { useMemo, useState } from "react";
import { FilterChips } from "../components/FilterChips";
import { GlowBackground } from "../components/GlowBackground";
import { ItemCard } from "../components/ItemCard";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { Category } from "../data/sources";
import type { DailyDigest } from "../types";

interface TodayPageProps {
  digest: DailyDigest;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  onBack?: () => void;
}

export function TodayPage({ digest, isFavorite, onToggleFavorite, onOpen, onBack }: TodayPageProps) {
  const [category, setCategory] = useState<Category>("全部");

  const items = useMemo(
    () => (category === "全部" ? digest.items : digest.items.filter((item) => item.category === category)),
    [digest.items, category],
  );

  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        {onBack ? <TopBar title="历史日报" onBack={onBack} /> : null}

        <header className="brand-header">
          <div className="brand-name">
            假装懂 <span>AI</span>
          </div>
          <span className="date-pill">{digest.label}</span>
        </header>

        <section className="hero">
          <div className="hero__orb" aria-hidden="true" />
          <p className="hero__kicker">{digest.kicker}</p>
          <h1 className="hero__title">{digest.headline}</h1>
          <p className="hero__meta">
            {digest.items.length} 条内容 · 5 分钟读完 · 用产品视野看 AI
          </p>
        </section>

        <FilterChips value={category} onChange={setCategory} />

        <section className="section">
          <h2 className="section__title">
            今日 {items.length} 条 <span className="section__count">按热度排序</span>
          </h2>
          <div className="stack">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                favorite={isFavorite(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpen}
              />
            ))}
          </div>
          {items.length === 0 ? <p className="empty-state">这个分类今天还没有内容</p> : null}
        </section>
      </div>

      <TabBar current={onBack ? "day" : "today"} />
    </div>
  );
}