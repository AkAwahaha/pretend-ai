import { Bookmark, ExternalLink } from "lucide-react";
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
}

export function DetailPage({ item, favorite, onToggleFavorite, onBack }: DetailPageProps) {
  return (
    <div className="frame">
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
      </div>
    </div>
  );
}
