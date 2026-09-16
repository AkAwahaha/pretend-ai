import { useCallback, useEffect, useState } from "react";

export const NOTES_KEY = "pretend-ai:notes";

export interface NoteLink {
  itemId: string;
  title: string;
  sourceLabel: string;
  sourceUrl: string;
  date: string;
}

export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  link?: NoteLink;
}

export interface NoteInput {
  content: string;
  link?: NoteLink;
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function normalizeLink(value: unknown): NoteLink | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const link = value as Record<string, unknown>;
  if (
    typeof link.itemId !== "string" ||
    typeof link.title !== "string" ||
    typeof link.sourceLabel !== "string" ||
    typeof link.sourceUrl !== "string" ||
    typeof link.date !== "string"
  ) {
    return undefined;
  }
  return {
    itemId: link.itemId,
    title: link.title,
    sourceLabel: link.sourceLabel,
    sourceUrl: link.sourceUrl,
    date: link.date,
  };
}

function readNotes(): Note[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(NOTES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
      .filter(
        (entry) =>
          typeof entry.id === "string" &&
          typeof entry.content === "string" &&
          entry.content.trim().length > 0 &&
          typeof entry.createdAt === "number" &&
          typeof entry.updatedAt === "number",
      )
      .map((entry) => ({
        id: entry.id as string,
        content: entry.content as string,
        createdAt: entry.createdAt as number,
        updatedAt: entry.updatedAt as number,
        link: normalizeLink(entry.link),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => readNotes());

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch {
      // 存储空间不足时保留当前会话内的内容。
    }
  }, [notes]);

  const addNote = useCallback((input: NoteInput) => {
    const content = input.content.trim();
    if (!content) {
      return null;
    }
    const now = Date.now();
    const note: Note = {
      id: makeId(),
      content,
      createdAt: now,
      updatedAt: now,
      link: input.link,
    };
    setNotes((prev) => [note, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
    return note;
  }, []);

  const updateNote = useCallback((id: string, content: string) => {
    const nextContent = content.trim();
    if (!nextContent) {
      return;
    }
    const now = Date.now();
    setNotes((prev) =>
      prev
        .map((note) => (note.id === id ? { ...note, content: nextContent, updatedAt: now } : note))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  return { notes, addNote, updateNote, removeNote };
}
