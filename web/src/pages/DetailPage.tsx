import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent } from "react";
import {
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  BookOpen,
  Lightbulb,
  Download,
  FileDown,
  Flame,
  Loader2,
} from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { NoteComposer } from "../components/NoteComposer";
import { SourceTag } from "../components/SourceTag";
import { ThreeQuestionCard } from "../components/ThreeQuestionCard";
import { TopBar } from "../components/TopBar";
import { dateFromItemId, downloadMarkdown, itemFileName, itemToMarkdown } from "../lib/markdown";
import {
  OBSIDIAN_URI_MAX_LENGTH,
  buildObsidianUri,
  describeObsidianError,
  getObsidianKey,
  saveToObsidian,
  setObsidianKey,
  testObsidianConnection,
} from "../lib/obsidian";
import type { MasteryState } from "../hooks/useMastery";
import type { NoteInput } from "../hooks/useNotes";
import type { DigestItem } from "../types";

interface DetailPageProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onBack: () => void;
  navIds?: string[];
  onNavigate?: (id: string) => void;
  mastery?: MasteryState | null;
  onCreateNote?: (input: NoteInput) => unknown;
  onSetMastery?: (id: string, state: MasteryState) => void;
}

const SHOW_OBSIDIAN = false;
const MAX_DRAG = 200;
const TURN_RATIO = 220;

export function DetailPage({
  item,
  favorite,
  onToggleFavorite,
  onBack,
  navIds = [],
  onNavigate,
  mastery = null,
  onCreateNote,
  onSetMastery,
}: DetailPageProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const dragDelta = useRef(0);
  const pendingDelta = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [obsidianState, setObsidianState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [obsidianMessage, setObsidianMessage] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const index = navIds.indexOf(item.id);
  const prevId = index > 0 ? navIds[index - 1] : undefined;
  const nextId = index >= 0 && index < navIds.length - 1 ? navIds[index + 1] : undefined;

  const date = dateFromItemId(item.id);
  const fileName = itemFileName(item, date);
  const markdown = itemToMarkdown(item, date);

  const applyDrag = useCallback((delta: number) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const ratio = Math.max(-1, Math.min(1, delta / TURN_RATIO));
    const deg = ratio * -16;
    panel.style.transform = `translate3d(${delta}px, 0, 0) rotateY(${deg}deg)`;
    panel.style.transformOrigin = delta > 0 ? "right center" : "left center";
    panel.style.setProperty("--drag-x", `${delta}px`);
    panel.style.setProperty("--drag-rot", `${deg}deg`);
  }, []);

  const commitNavigation = useCallback(
    (targetId: string, nextDirection: "next" | "prev") => {
      if (!onNavigate) {
        return;
      }
      const panel = panelRef.current;
      if (panel) {
        panel.style.removeProperty("transform");
      }
      setDirection(nextDirection);
      dragDelta.current = 0;
      pendingDelta.current = 0;
      onNavigate(targetId);
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



  useEffect(() => {
    setObsidianState("idle");
    setObsidianMessage("");
    setNoteSaved(false);
  }, [item.id]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  const resetDrag = () => {
    const panel = panelRef.current;
    if (panel) {
      panel.style.removeProperty("transform");
    }
    dragDelta.current = 0;
    pendingDelta.current = 0;
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) {
      return;
    }
    const current = event.touches[0]?.clientX ?? touchStartX.current;
    const next = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, current - touchStartX.current));
    dragDelta.current = next;
    pendingDelta.current = next;

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        applyDrag(pendingDelta.current);
      });
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setDragging(false);

    if (start === null) {
      resetDrag();
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? start;
    const delta = endX - start;

    if (delta > 60 && prevId) {
      commitNavigation(prevId, "prev");
      return;
    }
    if (delta < -60 && nextId) {
      commitNavigation(nextId, "next");
      return;
    }
    resetDrag();
  };

  const handleSaveToObsidian = async () => {
    if (!getObsidianKey()) {
      setShowKeyPanel(true);
      return;
    }
    setObsidianState("saving");
    setObsidianMessage("");
    try {
      const path = await saveToObsidian(fileName, markdown);
      setObsidianState("saved");
      setObsidianMessage(`已存入 ${path}`);
    } catch (error) {
      setObsidianState("error");
      setObsidianMessage(describeObsidianError(error));
    }
  };

  const handleOpenInObsidian = () => {
    const uri = buildObsidianUri(fileName, markdown);
    if (uri.length > OBSIDIAN_URI_MAX_LENGTH) {
      setObsidianState("error");
      setObsidianMessage("这条内容较长，系统可能截断 URI，建议用左边的「存入 Obsidian」（电脑）或「下载」（手机）");
      return;
    }
    window.location.href = uri;
  };

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) {
      return;
    }
    setObsidianKey(key);
    try {
      await testObsidianConnection(key);
      setShowKeyPanel(false);
      setObsidianState("saved");
      setObsidianMessage("连接成功，再点一次就能存入");
    } catch (error) {
      setObsidianState("error");
      setObsidianMessage(describeObsidianError(error));
    }
  };

  const showImage = Boolean(item.image) && !imageFailed;

  return (
    <div
      className="frame frame--detail"
      data-turning={dragging}
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
          ref={panelRef}
          className="detail-panel"
          key={item.id}
          data-direction={direction}
          data-dragging={dragging}
        >
          {showImage ? (
            <div className="detail-banner">
              <img src={item.image} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
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
            {onSetMastery ? (
              <div className="mastery-block">
                <p className="mastery-block__label">这条掌握了吗？</p>
                <div className="mastery-actions">
                  <button
                    type="button"
                    className={mastery === "mastered" ? "mastery-btn mastery-btn--done" : "mastery-btn"}
                    aria-pressed={mastery === "mastered"}
                    onClick={() => onSetMastery(item.id, "mastered")}
                  >
                    <CheckCircle2 size={15} />
                    已掌握
                  </button>
                  <button
                    type="button"
                    className={mastery === "unmastered" ? "mastery-btn mastery-btn--todo" : "mastery-btn"}
                    aria-pressed={mastery === "unmastered"}
                    onClick={() => onSetMastery(item.id, "unmastered")}
                  >
                    <CircleDot size={15} />
                    未掌握
                  </button>
                </div>
                {mastery ? (
                  <p className={`mastery-status mastery-status--${mastery}`}>
                    {mastery === "mastered"
                      ? "已掌握：首页进度会更新，且不会进入复习列表"
                      : "未掌握：已加入复习列表，下次可以从首页继续"}
                  </p>
                ) : null}
              </div>
            ) : null}

            {onCreateNote ? (
              <section className="detail-note">
                <div className="detail-note__head">
                  <Lightbulb size={15} />
                  <span>记下灵感</span>
                </div>
                <NoteComposer
                  compact
                  placeholder="这条内容让你想到什么？"
                  submitLabel="保存灵感"
                  contextLabel={`关联：${item.title}`}
                  onSubmit={(content) => {
                    onCreateNote({
                      content,
                      link: {
                        itemId: item.id,
                        title: item.title,
                        sourceLabel: item.sourceLabel,
                        sourceUrl: item.sourceUrl,
                        date,
                      },
                    });
                    setNoteSaved(true);
                  }}
                />
                {noteSaved ? <p className="detail-note__saved">已保存到「我的灵感」</p> : null}
              </section>
            ) : null}
            <div className="detail-actions">
              <a className="read-original" href={item.sourceUrl} target="_blank" rel="noreferrer">
                阅读原文
                <ArrowUpRight size={15} />
              </a>
              {SHOW_OBSIDIAN ? (
                <button
                  type="button"
                  className="obsidian-btn"
                  aria-label="存入 Obsidian"
                  title="存入 Obsidian 的 raw 文件夹"
                  disabled={obsidianState === "saving"}
                  onClick={handleSaveToObsidian}
                >
                  {obsidianState === "saving" ? <Loader2 size={16} className="spin" /> : <FileDown size={16} />}
                </button>
              ) : null}
              <button
                type="button"
                className="obsidian-btn"
                aria-label="下载 Markdown 文件"
                title="下载 Markdown 文件"
                onClick={() => downloadMarkdown(fileName, markdown)}
              >
                <Download size={16} />
              </button>
            </div>

            {SHOW_OBSIDIAN ? (
              <>
                <button type="button" className="obsidian-uri-btn" onClick={handleOpenInObsidian}>
                  <BookOpen size={15} />
                  在 Obsidian 中打开（手机可用）
                </button>

                {obsidianMessage ? (
                  <p className={obsidianState === "error" ? "obsidian-status obsidian-status--error" : "obsidian-status"}>
                    {obsidianMessage}
                  </p>
                ) : null}

                {showKeyPanel ? (
                  <div className="obsidian-panel">
                    <p className="obsidian-panel__title">填入 Obsidian API Key</p>
                    <p className="obsidian-panel__hint">
                      在 Obsidian 里打开「设置 → Local REST API」复制 API Key，粘贴到下面。它只保存在这台设备的浏览器里，不会上传。
                    </p>
                    <input
                      className="obsidian-panel__input"
                      type="password"
                      placeholder="粘贴 API Key"
                      value={keyInput}
                      onChange={(event) => setKeyInput(event.target.value)}
                    />
                    <div className="obsidian-panel__actions">
                      <button type="button" className="btn-primary" onClick={handleSaveKey}>
                        保存并测试连接
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => setShowKeyPanel(false)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

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