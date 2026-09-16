import { Bookmark, Flame } from "lucide-react";
import type { DigestItem } from "../types";
import { SourceTag } from "./SourceTag";

interface ItemCardProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
}

export function ItemCard({ item, favorite, onToggleFavorite, onOpen }: ItemCardProps) {
  return (
    <article className="item-card">
      <div className="item-card__head">
        <SourceTag source={item.source} label={item.sourceLabel} />
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
      <h3 className="item-card__title">
        <button type="button" onClick={() => onOpen(item.id)}>
          {item.title}
        </button>
      </h3>
      <p className="item-card__summary">{item.summary}</p>
      <div className="item-card__meta">
        <span className="topic-chip">{item.category}</span>
        <span className="item-card__time">{item.readTime}</span>
      </div>
    </article>
  );
}