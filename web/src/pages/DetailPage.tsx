import { useCallback, useEffect, useRef } from "react";
import type { TouchEvent } from "react";
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { SourceTag } from "../components/SourceTag";
import { ThreeQuestionCard } from "../components/ThreeQuestionCard";
import { TopBar } from "../components/TopBar";
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
  const index = navIds.indexOf(item.id);
  const prevId = index > 0 ? navIds[index - 1] : undefined;
  const nextId = index >= 0 && index < navIds.length - 1 ? navIds[index + 1] : undefined;

  const goPrev = useCallback(() => {
    if (prevId && onNavigate) {
      onNavigate(prevId);
    }
  }, [prevId, onNavigate]);

  const goNext = useCallback(() => {
    if (nextId && onNavigate) {
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

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
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
    <div className="frame" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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

        <article className="detail-head">
          <SourceTag source={item.source} label={item.sourceLabel} />
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
        </article>

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