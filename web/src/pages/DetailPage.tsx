import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Flame } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { SourceTag } from "../components/SourceTag";
import { ThreeQuestionCard } from "../components/ThreeQuestionCard";
import { TopBar } from "../components/TopBar";
import { SOURCE_META } from "../data/sources";
import type { DigestItem } from "../types";

interface DetailPageProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  navIds?: string[];
  onNavigate?: (id: string) => void;
}

export function DetailPage({
  item,
  favorite,
  onToggleFavorite,
  onBack,
  navIds = [],
  onNavigate,
}: DetailPageProps) {
  const touchStartX = useRef<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [dragX, setDragX] = useState(0);
  const index = navIds.indexOf(item.id);
  const prevId = index > 0 ? navIds[index - 1] : undefined;
  const nextId = index >= 0 && index < navIds.length - 1 ? navIds[index + 1] : undefined;
  const meta = SOURCE_META[item.source];

  const goPrev = useCallback(() => {
    if (prevId && onNavigate) {
      setDirection("prev");
      onNavigate(prevId);
    }
  }, [prevId, onNavigate]);

  const goNext = useCallback(() => {
    if (nextId && onNavigate) {
      setDirection("next");
      onNavigate(nextId);
    }
  }, [nextId, onNavigate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goPrev();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }
    const current = event.touches[0]?.clientX ?? touchStartX.current;
    const delta = current - touchStartX.current;
    setDragX(Math.max(-90, Math.min(90, delta)));
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setDragX(0);
    if (start === null) {
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? start;
    const delta = endX - start;
    if (Math.abs(delta) < 60) {
      return;
    }
    if (delta > 0) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <div className="frame" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <GlowBackground />
      <div className="content">
        <TopBar
          onBack={onBack}
          right={
            <button
              type="button"
              className={favorite ? "top-bar__btn bookmark-btn--active" : "top-bar__btn"}
              aria-label={favorite ? "取消收藏" : "收藏"}
              aria-pressed={favorite}
              onClick={() => onToggleFavorite(item.id)}
            >
              <Bookmark size={18} fill={favorite ? "currentColor" : "none"} />
            </button>
          }
        />

        <div
          className="detail-panel"
          key={item.id}
          data-direction={direction}
          style={dragX ? ({ transform: `translateX(${dragX}px)` } as CSSProperties) : undefined}
        >
          <div className="detail-strip" style={{ background: meta?.color ?? "#5e6ad2" }} />

          <div className="detail-head">
            <div className="detail-meta">
              <SourceTag source={item.source} label={item.sourceLabel} />
              <span className="topic-chip">{item.category}</span>
              {item.heat ? (
                <span className="heat-badge">
                  <Flame size={12} />
                  {item.heat}
                </span>
              ) : null}
              <span className="detail-meta__time">{item.readTime}</span>
            </div>

            <h1 className="detail-title">{item.title}</h1>
            <p className="detail-summary">{item.summary}</p>

            <a className="read-original" href={item.sourceUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={15} />
              阅读原文
            </a>

            <ThreeQuestionCard item={item} />

            <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              {item.sourceUrl}
            </a>
          </div>
        </div>

        {navIds.length > 1 ? (
          <div className="detail-nav">
            <button type="button" onClick={goPrev} disabled={!prevId} aria-label="上一条">
              <ChevronLeft size={16} />
              上一条
            </button>
            <span className="detail-nav__count">
              {index + 1} / {navIds.length}
            </span>
            <button type="button" onClick={goNext} disabled={!nextId} aria-label="下一条">
              下一条
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}