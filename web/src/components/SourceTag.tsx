import { SOURCE_META } from "../data/sources";
import type { SourceKey } from "../types";

interface SourceTagProps {
  source: SourceKey;
  label?: string;
  variant?: "pill" | "text";
}

export function SourceTag({ source, label, variant = "pill" }: SourceTagProps) {
  const meta = SOURCE_META[source];
  const text = label ?? meta.label;
  const dot = <span className="source-dot" style={{ background: meta.color }} aria-hidden="true" />;

  if (variant === "text") {
    return (
      <span className="source-tag source-tag--text">
        {dot}
        {text}
      </span>
    );
  }

  return (
    <span className="source-tag">
      {dot}
      {text}
    </span>
  );
}