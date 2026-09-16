import { useEffect, useState } from "react";
import { Download, ExternalLink, FileDown, Lightbulb, Loader2, Save, Trash2 } from "lucide-react";
import { GlowBackground } from "../components/GlowBackground";
import { NoteComposer } from "../components/NoteComposer";
import { TabBar } from "../components/TabBar";
import { TopBar } from "../components/TopBar";
import type { Note } from "../hooks/useNotes";
import { downloadMarkdown, notesFileName, notesToMarkdown } from "../lib/markdown";
import {
  OBSIDIAN_URI_MAX_LENGTH,
  buildObsidianUri,
  describeObsidianError,
  getObsidianKey,
  saveToObsidian,
  setObsidianKey,
  testObsidianConnection,
} from "../lib/obsidian";

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

function todayString() {
  const date = new Date();
  const pad = (part: number) => String(part).padStart(2, "0");
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
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
  const [obsidianState, setObsidianState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [obsidianMessage, setObsidianMessage] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const date = todayString();
  const fileName = notesFileName(date);
  const markdown = notesToMarkdown(notes, date);

  const handleSaveToObsidian = async () => {
    if (!getObsidianKey()) {
      setShowKeyPanel(true);
      return;
    }
    setObsidianState("saving");
    setObsidianMessage("");
    try {
      const path = await saveToObsidian(fileName, markdown);
      setObsidianState("saved");
      setObsidianMessage(`已存入 ${path}`);
    } catch (error) {
      setObsidianState("error");
      setObsidianMessage(describeObsidianError(error));
    }
  };

  const handleOpenInObsidian = () => {
    const uri = buildObsidianUri(fileName, markdown);
    if (uri.length > OBSIDIAN_URI_MAX_LENGTH) {
      setObsidianState("error");
      setObsidianMessage("灵感内容较长，手机 URI 可能被截断，请使用「导入 Obsidian」或「下载 Markdown」");
      return;
    }
    window.location.href = uri;
  };

  const handleSaveKey = async () => {
    const key = keyInput.trim();
    if (!key) {
      return;
    }
    setObsidianKey(key);
    try {
      await testObsidianConnection(key);
      setShowKeyPanel(false);
      setObsidianState("saved");
      setObsidianMessage("连接成功，再点一次就能导入");
    } catch (error) {
      setObsidianState("error");
      setObsidianMessage(describeObsidianError(error));
    }
  };

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

        {notes.length > 0 ? (
          <div className="notes-actions">
            <button type="button" className="notes-obsidian-btn" onClick={handleSaveToObsidian}>
              {obsidianState === "saving" ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />}
              导入 Obsidian
            </button>
            <button type="button" className="notes-obsidian-btn" onClick={handleOpenInObsidian}>
              手机打开
            </button>
            <button
              type="button"
              className="notes-obsidian-btn notes-obsidian-btn--ghost"
              aria-label="下载全部灵感 Markdown"
              onClick={() => downloadMarkdown(fileName, markdown)}
            >
              <Download size={14} />
            </button>
          </div>
        ) : null}

        {obsidianMessage ? (
          <p className={obsidianState === "error" ? "obsidian-status obsidian-status--error" : "obsidian-status"}>
            {obsidianMessage}
          </p>
        ) : null}

        {showKeyPanel ? (
          <div className="obsidian-panel">
            <p className="obsidian-panel__title">填入 Obsidian API Key</p>
            <p className="obsidian-panel__hint">
              在 Obsidian 的 Local REST API 设置里复制 API Key。它只保存在当前浏览器，不会上传。
            </p>
            <input
              className="obsidian-panel__input"
              type="password"
              placeholder="粘贴 API Key"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
            />
            <div className="obsidian-panel__actions">
              <button type="button" className="btn-primary" onClick={handleSaveKey}>
                保存并测试连接
              </button>
              <button type="button" className="btn-ghost" onClick={() => setShowKeyPanel(false)}>
                取消
              </button>
            </div>
          </div>
        ) : null}

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
