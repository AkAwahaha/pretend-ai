import { useMemo, useState } from "react";
import { CheckCircle2, CircleDot, Compass, Download, Play, SlidersHorizontal } from "lucide-react";
import { FilterChips } from "../components/FilterChips";
import { GlowBackground } from "../components/GlowBackground";
import { ItemCard } from "../components/ItemCard";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { Category } from "../data/sources";
import type { MasteryState } from "../hooks/useMastery";
import { digestFileName, digestToMarkdown, downloadMarkdown } from "../lib/markdown";
import type { DailyDigest } from "../types";

const BUILD_ID = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";

interface TodayPageProps {
  digest: DailyDigest;
  isFavorite: (id: string) => boolean;
  getMastery: (id: string) => MasteryState | null;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  onBack?: () => void;
}

export function TodayPage({ digest, isFavorite, getMastery, onToggleFavorite, onOpen, onBack }: TodayPageProps) {
  const [category, setCategory] = useState<Category>("全部");
  const [showFilters, setShowFilters] = useState(false);

  const masteredCount = digest.items.filter((item) => getMastery(item.id) === "mastered").length;
  const unmasteredItems = digest.items.filter((item) => getMastery(item.id) === "unmastered");
  const unmarkedItems = digest.items.filter((item) => getMastery(item.id) === null);
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
          <div className="hero__main">
            <div className="hero__text">
              <p className="hero__kicker">{digest.kicker}</p>
              <h1 className="hero__title">{digest.headline}</h1>
            </div>
            <div className="hero__orb" aria-hidden="true" />
          </div>
          <p className="hero__meta">用产品视野看 AI · 每日更新 · {BUILD_ID}</p>
        </section>

        {digest.mainline ? (
          <section className="mainline">
            <p className="mainline__label">
              <Compass size={13} />
              今日主线
            </p>
            <p className="mainline__text">{digest.mainline}</p>
          </section>
        ) : null}

        <div className="filter-bar">
          <button
            type="button"
            className={category === "全部" ? "filter-toggle" : "filter-toggle filter-toggle--active"}
            aria-expanded={showFilters}
            aria-label="筛选分类"
            onClick={() => setShowFilters((value) => !value)}
          >
            <SlidersHorizontal size={14} />
            {category === "全部" ? "筛选" : category}
          </button>
          <div className="filter-bar__right">
            <span className="section__count">共 {items.length} 条</span>
            <button
              type="button"
              className="icon-btn"
              aria-label="导出今日日报为 Markdown"
              title="导出 Markdown（可导入 Obsidian）"
              onClick={() => downloadMarkdown(digestFileName(digest), digestToMarkdown(digest))}
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {showFilters ? (
          <FilterChips
            value={category}
            onChange={(next) => {
              setCategory(next);
              setShowFilters(false);
            }}
          />
        ) : null}

        <section className="section">
          <h2 className="section__title">
            今日 {items.length} 条 <span className="section__count">按热度排序</span>
          </h2>
          {category === "全部" ? (
            <div className="read-progress">
              <div className="read-progress__bar">
                <span
                  style={{
                    transform: `scaleX(${digest.items.length > 0 ? masteredCount / digest.items.length : 0})`,
                  }}
                />
              </div>
              <span className="read-progress__label">
                已掌握 {masteredCount}/{digest.items.length}
              </span>
            </div>
          ) : null}
          {category === "全部" && unmasteredItems.length > 0 ? (
            <button
              type="button"
              className="continue-btn"
              onClick={() => onOpen(unmasteredItems[0].id)}
            >
              <CircleDot size={14} />
              复习未掌握 · {unmasteredItems.length} 条
            </button>
          ) : null}
          {category === "全部" && unmasteredItems.length === 0 && unmarkedItems.length > 0 ? (
            <button type="button" className="continue-btn" onClick={() => onOpen(unmarkedItems[0].id)}>
              <Play size={14} />
              继续学习 · 还有 {unmarkedItems.length} 条未标记
            </button>
          ) : null}
          {category === "全部" && unmasteredItems.length === 0 && unmarkedItems.length === 0 ? (
            <p className="mastery-done">今日 {digest.items.length} 条已全部掌握</p>
          ) : null}
          <div className="stack">
            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                index={index}
                item={item}
                favorite={isFavorite(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpen}
              />
            ))}
          </div>
          {items.length === 0 ? <p className="empty-state">这个分类今天还没有内容</p> : null}
          {digest.takeaways && digest.takeaways.length > 0 ? (
            <div className="takeaways">
              <h3 className="takeaways__title">
                <CheckCircle2 size={15} />
                今日收获
              </h3>
              <ol className="takeaways__list">
                {digest.takeaways.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>
      </div>

      <TabBar current={onBack ? "day" : "today"} />
    </div>
  );
}