import { useState } from "react";
import type { FormEvent } from "react";
import { PenLine } from "lucide-react";

interface NoteComposerProps {
  onSubmit: (content: string) => void;
  placeholder?: string;
  submitLabel?: string;
  contextLabel?: string;
  compact?: boolean;
}

export function NoteComposer({
  onSubmit,
  placeholder = "记下一个想法…",
  submitLabel = "记录",
  contextLabel,
  compact = false,
}: NoteComposerProps) {
  const [value, setValue] = useState("");
  const canSubmit = value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form className={compact ? "note-composer note-composer--compact" : "note-composer"} onSubmit={handleSubmit}>
      <textarea
        className="note-composer__input"
        rows={compact ? 2 : 3}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="note-composer__footer">
        <span className="note-composer__context">{contextLabel}</span>
        <button type="submit" className="note-composer__submit" disabled={!canSubmit}>
          <PenLine size={13} />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
