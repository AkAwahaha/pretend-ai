import { useMemo, useState } from "react";
import { DetailPage } from "./pages/DetailPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { TodayPage } from "./pages/TodayPage";
import { ALL_ITEMS, findDigest } from "./data/mock";
import { useArchive } from "./hooks/useArchive";
import { useDayDigest } from "./hooks/useDayDigest";
import { useDigest } from "./hooks/useDigest";
import { useFavorites } from "./hooks/useFavorites";
import { useHashRoute } from "./hooks/useHashRoute";
import { useMastery } from "./hooks/useMastery";
import { useSearchIndex } from "./hooks/useSearchIndex";
import { navigate } from "./router";
import { dateFromItemId } from "./lib/markdown";
import type { DigestItem } from "./types";

export function App() {
  const route = useHashRoute();
  const { ids, toggle, isFavorite } = useFavorites();
  const { getMastery, setMastery } = useMastery();
  const { digest } = useDigest();
  const { entries, status: archiveStatus } = useArchive();
  const archiveDate =
    route.name === "day"
      ? route.date
      : route.name === "item"
        ? dateFromItemId(route.id)
        : undefined;
  const archived = useDayDigest(archiveDate);
  const [navIds, setNavIds] = useState<string[]>([]);
  const { entries: searchEntries } = useSearchIndex();

  const itemPool = useMemo(() => {
    const byId = new Map<string, DigestItem>();
    for (const item of ALL_ITEMS) {
      byId.set(item.id, item);
    }
    for (const item of digest.items) {
      byId.set(item.id, item);
    }
    if (archived) {
      for (const item of archived.items) {
        byId.set(item.id, item);
      }
    }
    return Array.from(byId.values());
  }, [digest, archived]);

  const favoriteItems = useMemo(
    () => itemPool.filter((item) => ids.includes(item.id)),
    [itemPool, ids],
  );

  const goToday = () => navigate("/today");
  const openItem = (id: string, list: Array<{ id: string }>) => {
    setNavIds(list.map((entry) => entry.id));
    navigate(`/item/${id}`);
  };

  if (route.name === "item") {
    const item = itemPool.find((entry) => entry.id === route.id);
    if (item) {
      return (
        <DetailPage
          item={item}
          favorite={isFavorite(item.id)}
          onToggleFavorite={toggle}
          onBack={goToday}
          mastery={getMastery(item.id)}
          onSetMastery={setMastery}
          navIds={navIds}
          onNavigate={(id) => navigate(`/item/${id}`)}
        />
      );
    }
  }

  if (route.name === "favorites") {
    return (
      <FavoritesPage
        items={favoriteItems}
        isFavorite={isFavorite}
        getMastery={getMastery}
        onToggleFavorite={toggle}
        onSetMastery={setMastery}
        onOpen={(id) => openItem(id, favoriteItems)}
        onBack={goToday}
      />
    );
  }

  if (route.name === "history") {
    return (
      <HistoryPage
        entries={entries}
        status={archiveStatus}
        searchEntries={searchEntries}
        onOpenDay={(date) => navigate(`/day/${date}`)}
        onOpenItem={(id) => openItem(id, searchEntries)}
        onBack={goToday}
      />
    );
  }

  if (route.name === "day") {
    const dayDigest = archived ?? findDigest(route.date);
    if (dayDigest) {
      return (
        <TodayPage
          digest={dayDigest}
          isFavorite={isFavorite}
          getMastery={getMastery}
          onToggleFavorite={toggle}
          onSetMastery={setMastery}
          onOpen={(id) => openItem(id, dayDigest.items)}
          onBack={goToday}
        />
      );
    }
  }

  return (
    <TodayPage
      digest={digest}
      isFavorite={isFavorite}
      getMastery={getMastery}
      onToggleFavorite={toggle}
      onSetMastery={setMastery}
      onOpen={(id) => openItem(id, digest.items)}
    />
  );
}
