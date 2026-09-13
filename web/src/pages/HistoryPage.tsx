import { ChevronRight } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { ArchiveEntry, ArchiveStatus } from "../hooks/useArchive";

interface HistoryPageProps {
  entries: ArchiveEntry[];
  status: ArchiveStatus;
  onOpenDay: (date: string) => void;
  onBack: () => void;
}

export function HistoryPage({ entries, status, onOpenDay, onBack }: HistoryPageProps) {
  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        <TopBar title="历史日报" onBack={onBack} />

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
      </div>

      <TabBar current="history" />
    </div>
  );
}