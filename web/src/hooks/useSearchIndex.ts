import { useEffect, useState } from "react";
import type { SearchEntry } from "../types";

export type SearchStatus = "loading" | "ready" | "empty";

export function useSearchIndex() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [status, setStatus] = useState<SearchStatus>("loading");

  useEffect(() => {
    let alive = true;
    fetch(import.meta.env.BASE_URL + "data/search-index.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("HTTP " + response.status))))
      .then((data: SearchEntry[]) => {
        if (!alive) {
          return;
        }
        const list = Array.isArray(data) ? data : [];
        setEntries(list);
        setStatus(list.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        if (alive) {
          setEntries([]);
          setStatus("empty");
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  return { entries, status };
}