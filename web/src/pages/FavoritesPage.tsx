import { ItemCard } from "../components/ItemCard";
import { GlowBackground } from "../components/GlowBackground";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { DigestItem } from "../types";

interface FavoritesPageProps {
  items: DigestItem[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
}

export function FavoritesPage({ items, isFavorite, onToggleFavorite, onOpen, onBack }: FavoritesPageProps) {
  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        <TopBar title="收藏" onBack={onBack} />

        {items.length === 0 ? (
          <p className="empty-state">还没有收藏，遇到好内容点一下书签留一份</p>
        ) : (
          <div className="stack">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                favorite={isFavorite(item.id)}
                onToggleFavorite={onToggleFavorite}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>

      <TabBar current="favorites" />
    </div>
  );
}
