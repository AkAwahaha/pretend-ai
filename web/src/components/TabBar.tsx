import { Bookmark, History, Lightbulb, Sparkles } from "lucide-react";
import { navigate, type Route } from "../router";

const TABS = [
  { key: "today", label: "今日", icon: Sparkles, path: "/today" },
  { key: "favorites", label: "收藏", icon: Bookmark, path: "/favorites" },
  { key: "history", label: "历史", icon: History, path: "/history" },
  { key: "notes", label: "我的灵感", icon: Lightbulb, path: "/notes" },
] as const;

export function TabBar({ current }: { current: Route["name"] }) {
  return (
    <nav className="tab-bar" aria-label="主导航">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = current === tab.key || (tab.key === "today" && current === "day");
        return (
          <button
            key={tab.key}
            type="button"
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={active ? "tab-bar__item tab-bar__item--active" : "tab-bar__item"}
            onClick={() => navigate(tab.path)}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
