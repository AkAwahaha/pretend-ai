import { useEffect, useState } from "react";
import type { DailyDigest } from "../types";

export function useDayDigest(date: string | undefined) {
  const [digest, setDigest] = useState<DailyDigest | null>(null);

  useEffect(() => {
    if (!date) {
      setDigest(null);
      return;
    }
    let alive = true;
    setDigest(null);
    fetch(import.meta.env.BASE_URL + "data/archive/" + date + ".json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("HTTP " + response.status))))
      .then((data: DailyDigest) => {
        if (alive && data && Array.isArray(data.items)) {
          setDigest(data);
        }
      })
      .catch(() => {
        if (alive) {
          setDigest(null);
        }
      });

    return () => {
      alive = false;
    };
  }, [date]);

  return digest;
}