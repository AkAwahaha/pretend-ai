import { useEffect, useState } from "react";
import { TODAY_DIGEST } from "../data/mock";
import type { DailyDigest } from "../types";

export type DigestStatus = "loading" | "ready" | "fallback";

export function useDigest(fallback: DailyDigest = TODAY_DIGEST) {
  const [digest, setDigest] = useState<DailyDigest>(fallback);
  const [status, setStatus] = useState<DigestStatus>("loading");

  useEffect(() => {
    let alive = true;
    const url = import.meta.env.BASE_URL + "data/latest.json";

    fetch(url)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("HTTP " + response.status))))
      .then((data: DailyDigest) => {
        if (!alive) {
          return;
        }
        if (!data || !Array.isArray(data.items) || data.items.length === 0) {
          throw new Error("日报数据为空");
        }
        setDigest(data);
        setStatus("ready");
      })
      .catch(() => {
        if (alive) {
          setStatus("fallback");
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  return { digest, status };
}