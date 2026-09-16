import { Bookmark } from "lucide-react";
import type { DigestItem } from "../types";
import { SourceTag } from "./SourceTag";

interface GlanceRowProps {
  item: DigestItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
}

export function GlanceRow({ item, favorite, onToggleFavorite, onOpen }: GlanceRowProps) {
  return (
    <article className="glance-row">
      <div className="glance-row__body">
        <div className="glance-row__head">
          <SourceTag source={item.source} label={item.sourceLabel} variant="text" />
          <span className="topic-chip topic-chip--mini">{item.category}</span>
        </div>
        <h3 className="glance-row__title">
          <button type="button" onClick={() => onOpen(item.id)}>
            {item.title}
          </button>
        </h3>
        <p className="glance-row__summary">{item.summary}</p>
      </div>
      <button
        type="button"
        aria-label={favorite ? "取消收藏" : "收藏"}
        aria-pressed={favorite}
        className={favorite ? "bookmark-btn bookmark-btn--active" : "bookmark-btn"}
        onClick={() => onToggleFavorite(item.id)}
      >
        <Bookmark size={15} fill={favorite ? "currentColor" : "none"} />
      </button>
    </article>
  );
}