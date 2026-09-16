import { useCallback, useEffect, useState } from "react";

export type MasteryState = "mastered" | "unmastered";
export const MASTERY_KEY = "pretend-ai:mastery";

type MasteryMap = Record<string, MasteryState>;

function readFromStorage(): MasteryMap {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(MASTERY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    const result: MasteryMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === "mastered" || value === "unmastered") {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function useMastery() {
  const [states, setStates] = useState<MasteryMap>(() => readFromStorage());

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    try {
      window.localStorage.setItem(MASTERY_KEY, JSON.stringify(states));
    } catch {
      // 忽略存储失败
    }
  }, [states]);

  const setMastery = useCallback((id: string, state: MasteryState) => {
    setStates((prev) => {
      if (prev[id] === state) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: state };
    });
  }, []);

  const getMastery = useCallback((id: string): MasteryState | null => states[id] ?? null, [states]);

  return { states, setMastery, getMastery };
}