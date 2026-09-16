import { useCallback, useEffect, useState } from "react";

export const READ_KEY = "pretend-ai:read";
const MAX_IDS = 500;

function readFromStorage(): string[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useReadItems() {
  const [ids, setIds] = useState<string[]>(() => readFromStorage());

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-MAX_IDS)));
    } catch {
      // 忽略存储失败
    }
  }, [ids]);

  const markRead = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const isRead = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, markRead, isRead };
}