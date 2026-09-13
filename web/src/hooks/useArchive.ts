import { useEffect, useState } from "react";

export interface ArchiveEntry {
  date: string;
  label: string;
  count?: number;
  title?: string;
  sources?: string[];
}

export type ArchiveStatus = "loading" | "ready" | "empty";

export function useArchive() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [status, setStatus] = useState<ArchiveStatus>("loading");

  useEffect(() => {
    let alive = true;
    fetch(import.meta.env.BASE_URL + "data/index.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("HTTP " + response.status))))
      .then((data: ArchiveEntry[]) => {
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