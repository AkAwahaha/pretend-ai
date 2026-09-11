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

  if (variant === "text") {
    return (
      <span className="source-tag source-tag--text" style={{ color: meta.color }}>
        {text}
      </span>
    );
  }

  return (
    <span className="source-tag" style={{ background: meta.tint, color: meta.color }}>
      {text}
    </span>
  );
}
