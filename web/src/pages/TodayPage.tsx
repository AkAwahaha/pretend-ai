import { useMemo, useState } from "react";
import { FilterChips } from "../components/FilterChips";
import { DeepCard } from "../components/DeepCard";
import { GlanceRow } from "../components/GlanceRow";
import { GlowBackground } from "../components/GlowBackground";
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

  const filtered = useMemo(
    () => (category === "全部" ? digest.items : digest.items.filter((item) => item.category === category)),
    [digest.items, category],
  );
  const featured = filtered.filter((item) => item.featured);
  const glance = filtered.filter((item) => !item.featured);

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

        {featured.length > 0 ? (
          <section className="section">
            <h2 className="section__title">
              精读 <span className="section__count">{featured.length} 条 · 完整拆解</span>
            </h2>
            <div className="stack">
              {featured.map((item) => (
                <DeepCard
                  key={item.id}
                  item={item}
                  favorite={isFavorite(item.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        ) : null}

        {glance.length > 0 ? (
          <section className="section">
            <h2 className="section__title">
              速览 <span className="section__count">{glance.length} 条 · 快速扫过</span>
            </h2>
            <div className="stack stack--list">
              {glance.map((item) => (
                <GlanceRow
                  key={item.id}
                  item={item}
                  favorite={isFavorite(item.id)}
                  onToggleFavorite={onToggleFavorite}
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filtered.length === 0 ? <p className="empty-state">这个分类今天还没有内容</p> : null}
      </div>

      <TabBar current={onBack ? "day" : "today"} />
    </div>
  );
}
