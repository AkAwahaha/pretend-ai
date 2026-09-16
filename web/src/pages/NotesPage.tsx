import { useEffect, useState } from "react";
import { ExternalLink, Lightbulb, Save, Trash2 } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { NoteComposer } from "../components/NoteComposer";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { Note } from "../hooks/useNotes";

interface NotesPageProps {
  notes: Note[];
  onCreate: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NoteCard({
  note,
  onUpdate,
  onRemove,
}: {
  note: Note;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState(note.content);
  const dirty = draft.trim().length > 0 && draft.trim() !== note.content;

  useEffect(() => {
    setDraft(note.content);
  }, [note.content]);

  return (
    <article className="note-card">
      <textarea
        className="note-card__input"
        value={draft}
        aria-label="编辑灵感"
        onChange={(event) => setDraft(event.target.value)}
      />

      {note.link ? (
        <a className="note-card__link" href={note.link.sourceUrl} target="_blank" rel="noreferrer">
          <span>
            {note.link.sourceLabel} · {note.link.title}
          </span>
          <ExternalLink size={13} />
        </a>
      ) : (
        <span className="note-card__standalone">独立笔记</span>
      )}

      <div className="note-card__footer">
        <time className="note-card__time">{formatTime(note.updatedAt)}</time>
        <div className="note-card__actions">
          {dirty ? (
            <button type="button" className="note-card__save" onClick={() => onUpdate(note.id, draft)}>
              <Save size={13} />
              保存
            </button>
          ) : null}
          <button type="button" className="note-card__delete" aria-label="删除这条灵感" onClick={() => onRemove(note.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function NotesPage({ notes, onCreate, onUpdate, onRemove, onBack }: NotesPageProps) {
  return (
    <div className="frame">
      <GlowBackground />
      <div className="content">
        <TopBar title="我的灵感" onBack={onBack} />

        <section className="notes-hero">
          <div>
            <p className="notes-hero__kicker">IDEA NOTES</p>
            <h1 className="notes-hero__title">把想法留下来</h1>
          </div>
          <Lightbulb size={30} />
        </section>

        <NoteComposer onSubmit={onCreate} placeholder="现在在想什么？" submitLabel="收进灵感" />

        {notes.length === 0 ? (
          <p className="empty-state">还没有记录，从一个想法开始</p>
        ) : (
          <div className="notes-list">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>

      <TabBar current="notes" />
    </div>
  );
}
