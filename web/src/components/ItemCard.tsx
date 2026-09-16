import { useState } from "react";
import type { CSSProperties } from "react";
import { Bookmark, Check, Flame } from "lucide-react";
import type { DigestItem } from "../types";
import { SourceTag } from "./SourceTag";

interface ItemCardProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  index?: number;
  read?: boolean;
}

export function ItemCard({ item, favorite, onToggleFavorite, onOpen, index = 0, read = false }: ItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image) && !imageFailed;

  return (
    <article className="item-card" style={{ "--index": index } as CSSProperties}>
      <div className="item-card__head">
        <div className="item-card__tags">
          <SourceTag source={item.source} label={item.sourceLabel} />
          {read ? (
            <span className="read-badge">
              <Check size={11} />
              已读
            </span>
          ) : null}
        </div>
        <div className="item-card__actions">
          {item.heat ? (
            <span className="heat-badge" title="热度">
              <Flame size={12} />
              {item.heat}
            </span>
          ) : null}
          <button
            type="button"
            aria-label={favorite ? "取消收藏" : "收藏"}
            aria-pressed={favorite}
            className={favorite ? "bookmark-btn bookmark-btn--active" : "bookmark-btn"}
            onClick={() => onToggleFavorite(item.id)}
          >
            <Bookmark size={16} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="item-card__body">
        <div
          className="item-card__thumb"
          style={showImage ? undefined : { background: "var(--brand-tint)", color: "var(--brand)" }}
        >
          {showImage ? (
            <img src={item.image} alt="" loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <span>{item.sourceLabel.slice(0, 2)}</span>
          )}
        </div>
        <div className="item-card__text">
          <h3 className="item-card__title">
            <button type="button" onClick={() => onOpen(item.id)}>
              {item.title}
            </button>
          </h3>
          <p className="item-card__summary">{item.summary}</p>
        </div>
      </div>

      <div className="item-card__meta">
        <span className="topic-chip">{item.category}</span>
        <span className="item-card__time">{item.readTime}</span>
      </div>
    </article>
  );
}