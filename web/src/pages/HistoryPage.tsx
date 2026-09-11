import { ChevronRight } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { DailyDigest } from "../types";

interface HistoryPageProps {
  digests: DailyDigest[];
  onOpenDay: (date: string) => void;
  onBack: () => void;
}

export function HistoryPage({ digests, onOpenDay, onBack }: HistoryPageProps) {
  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        <TopBar title="历史日报" onBack={onBack} />

        <div className="stack">
          {digests.map((digest) => (
            <button key={digest.date} type="button" className="history-row" onClick={() => onOpenDay(digest.date)}>
              <span className="history-row__date">{digest.label}</span>
              <span className="history-row__body">
                <span className="glance-row__title">{digest.items[0]?.title ?? "当日日报"}</span>
                <span className="history-row__summary">
                  {digest.items.map((item) => item.sourceLabel).join(" · ")}
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
