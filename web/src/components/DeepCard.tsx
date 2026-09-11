import { Bookmark } from "lucide-react";
import type { DigestItem } from "../types";
import { SourceTag } from "./SourceTag";

interface DeepCardProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
}

export function DeepCard({ item, favorite, onToggleFavorite, onOpen }: DeepCardProps) {
  return (
    <article className="deep-card">
      <SourceTag source={item.source} label={item.sourceLabel} />
      <h3 className="deep-card__title">
        <button type="button" onClick={() => onOpen(item.id)}>
          {item.title}
        </button>
      </h3>
      <p className="deep-card__summary">{item.summary}</p>
      <p className="deep-card__footer">亮点 · 思路 · 产品视角</p>
      <button
        type="button"
        aria-label={favorite ? "取消收藏" : "收藏"}
        aria-pressed={favorite}
        className={favorite ? "bookmark-btn bookmark-btn--active" : "bookmark-btn"}
        onClick={() => onToggleFavorite(item.id)}
      >
        <Bookmark size={16} fill={favorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
