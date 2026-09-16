import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { ArchiveEntry, ArchiveStatus } from "../hooks/useArchive";
import type { SearchEntry } from "../types";

interface HistoryPageProps {
  entries: ArchiveEntry[];
  status: ArchiveStatus;
  searchEntries: SearchEntry[];
  onOpenDay: (date: string) => void;
  onOpenItem: (id: string) => void;
  onBack: () => void;
}

export function HistoryPage({
  entries,
  status,
  searchEntries,
  onOpenDay,
  onOpenItem,
  onBack,
}: HistoryPageProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (keyword.length === 0) {
      return [];
    }
    return searchEntries
      .filter((entry) =>
        [entry.title, entry.summary, entry.category, entry.source].some((field) =>
          String(field ?? "").toLowerCase().includes(keyword),
        ),
      )
      .slice(0, 30);
  }, [query, searchEntries]);

  const searching = query.trim().length > 0;

  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        <TopBar title="历史日报" onBack={onBack} />

        <div className="search-bar">
          <Search size={15} />
          <input
            className="search-bar__input"
            type="search"
            placeholder="搜索历史内容、来源或主题"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {searching ? (
          <div className="search-results">
            {matches.length > 0 ? (
              matches.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="search-result"
                  onClick={() => onOpenItem(entry.id)}
                >
                  <span className="search-result__meta">
                    {entry.date} · {entry.source} · {entry.category}
                  </span>
                  <span className="search-result__title">{entry.title}</span>
                  <span className="search-result__summary">{entry.summary}</span>
                </button>
              ))
            ) : (
              <p className="empty-state">没有找到匹配的内容</p>
            )}
          </div>
        ) : (
          <>
            {status === "loading" ? <p className="empty-state">正在加载历史…</p> : null}
            {status === "empty" ? <p className="empty-state">还没有历史日报，从明天开始会自动积累</p> : null}

            <div className="stack">
              {entries.map((entry) => (
                <button key={entry.date} type="button" className="history-row" onClick={() => onOpenDay(entry.date)}>
                  <span className="history-row__date">{entry.label}</span>
                  <span className="history-row__body">
                    <span className="history-row__title">{entry.title || "当日日报"}</span>
                    <span className="history-row__summary">
                      {(entry.sources ?? []).join(" · ")}
                      {entry.count ? " · " + entry.count + " 条" : ""}
                    </span>
                  </span>
                  <ChevronRight size={16} className="history-row__arrow" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <TabBar current="history" />
    </div>
  );
}