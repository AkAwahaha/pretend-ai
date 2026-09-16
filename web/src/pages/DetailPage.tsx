import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { ArrowUpRight, Bookmark, ChevronLeft, ChevronRight, Flame } from "lucide-react";
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
  const timerRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [phase, setPhase] = useState<"idle" | "out">("idle");
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const index = navIds.indexOf(item.id);
  const prevId = index > 0 ? navIds[index - 1] : undefined;
  const nextId = index >= 0 && index < navIds.length - 1 ? navIds[index + 1] : undefined;

  const turnRatio = Math.max(-1, Math.min(1, dragX / 220));
  const turnDeg = turnRatio * -18;

  const commitNavigation = useCallback(
    (targetId: string, nextDirection: "next" | "prev") => {
      if (!onNavigate) {
        return;
      }
      setDirection(nextDirection);
      setPhase("out");
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setPhase("idle");
        setDragX(0);
        onNavigate(targetId);
      }, 210);
    },
    [onNavigate],
  );

  const goPrev = useCallback(() => {
    if (prevId) {
      commitNavigation(prevId, "prev");
    }
  }, [prevId, commitNavigation]);

  const goNext = useCallback(() => {
    if (nextId) {
      commitNavigation(nextId, "next");
    }
  }, [nextId, commitNavigation]);

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

  useEffect(() => {
    const onScroll = () => {
      const element = document.documentElement;
      const max = element.scrollHeight - element.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, element.scrollTop / max)) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [item.id]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }
    const current = event.touches[0]?.clientX ?? touchStartX.current;
    const delta = current - touchStartX.current;
    setDragX(Math.max(-200, Math.min(200, delta)));
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setDragging(false);
    if (start === null) {
      setDragX(0);
      return;
    }
    const endX = event.changedTouches[0]?.clientX ?? start;
    const delta = endX - start;
    if (Math.abs(delta) < 60) {
      setDragX(0);
      return;
    }
    if (delta > 0 && prevId) {
      commitNavigation(prevId, "prev");
    } else if (delta < 0 && nextId) {
      commitNavigation(nextId, "next");
    } else {
      setDragX(0);
    }
  };

  const showImage = Boolean(item.image) && !imageFailed;
  const panelStyle = {
    "--drag-x": `${dragX}px`,
    "--drag-rot": `${turnDeg}deg`,
    transform: dragging ? `translateX(${dragX}px) rotateY(${turnDeg}deg)` : undefined,
    transformOrigin: dragX > 0 ? "right center" : "left center",
  } as CSSProperties;

  return (
    <div
      className="frame frame--detail"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="reading-progress">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
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
          data-phase={phase}
          data-dragging={dragging}
          style={panelStyle}
        >
          {showImage ? (
            <div className="detail-banner">
              <img src={item.image} alt="" loading="lazy" onError={() => setImageFailed(true)} />
              <span className="detail-banner__fade" />
            </div>
          ) : null}

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

            <div className="detail-quote">
              <p>{item.summary}</p>
            </div>

            <a className="read-original" href={item.sourceUrl} target="_blank" rel="noreferrer">
              阅读原文
              <ArrowUpRight size={15} />
            </a>

            <ThreeQuestionCard item={item} />

            <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
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

        {navIds.length > 1 ? <p className="swipe-hint">像翻书一样左右滑动切换</p> : null}
      </div>
    </div>
  );
}