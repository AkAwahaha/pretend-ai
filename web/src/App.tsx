import { useMemo } from "react";
import { DetailPage } from "./pages/DetailPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { TodayPage } from "./pages/TodayPage";
import { ALL_ITEMS, HISTORY_DIGESTS, findDigest } from "./data/mock";
import type { DigestItem } from "./types";
import { useDigest } from "./hooks/useDigest";
import { useFavorites } from "./hooks/useFavorites";
import { useHashRoute } from "./hooks/useHashRoute";
import { navigate } from "./router";

export function App() {
  const route = useHashRoute();
  const { ids, toggle, isFavorite } = useFavorites();
  const { digest } = useDigest();

  const itemPool = useMemo(() => {
    const byId = new Map<string, DigestItem>();
    for (const item of ALL_ITEMS) {
      byId.set(item.id, item);
    }
    for (const item of digest.items) {
      byId.set(item.id, item);
    }
    return Array.from(byId.values());
  }, [digest]);

  const favoriteItems = useMemo(
    () => itemPool.filter((item) => ids.includes(item.id)),
    [itemPool, ids],
  );

  const goToday = () => navigate("/today");
  const openItem = (id: string) => navigate(`/item/${id}`);

  if (route.name === "item") {
    const item = itemPool.find((entry) => entry.id === route.id);
    if (item) {
      return (
        <DetailPage
          item={item}
          favorite={isFavorite(item.id)}
          onToggleFavorite={toggle}
          onBack={goToday}
        />
      );
    }
  }

  if (route.name === "favorites") {
    return (
      <FavoritesPage
        items={favoriteItems}
        isFavorite={isFavorite}
        onToggleFavorite={toggle}
        onOpen={openItem}
        onBack={goToday}
      />
    );
  }

  if (route.name === "history") {
    return (
      <HistoryPage
        digests={HISTORY_DIGESTS}
        onOpenDay={(date) => navigate(`/day/${date}`)}
        onBack={goToday}
      />
    );
  }

  if (route.name === "day") {
    const digest = findDigest(route.date);
    if (digest) {
      return (
        <TodayPage
          digest={digest}
          isFavorite={isFavorite}
          onToggleFavorite={toggle}
          onOpen={openItem}
          onBack={goToday}
        />
      );
    }
  }

  return (
    <TodayPage
      digest={digest}
      isFavorite={isFavorite}
      onToggleFavorite={toggle}
      onOpen={openItem}
    />
  );
}
