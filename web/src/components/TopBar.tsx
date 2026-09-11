import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <div className="top-bar">
      {onBack ? (
        <button className="top-bar__btn" type="button" aria-label="返回" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
      ) : (
        <span className="top-bar__spacer" />
      )}
      <span className="top-bar__title">{title}</span>
      {right ?? <span className="top-bar__spacer" />}
    </div>
  );
}
